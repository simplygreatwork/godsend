![Godsend Logo](https://s3-us-west-2.amazonaws.com/notion-static/a7b5b59c35b2480e90126eadd33cf81f/godsend.png "Godsend Logo")

# Godsend
Separation of concerns for streaming micro-services.

[![Join the chat at https://gitter.im/godsendbus/Lobby](https://badges.gitter.im/godsendbus/Lobby.svg)](https://gitter.im/god-send/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An important goal for Godsend is to ease your software development workflow without tedium. For example, quickly save data to any undefined collection during the development process. Go back later to add validation for a collection as a message pattern processor on the bus in any order from anywhere in your application at any time. Then, add a data transformation processor from some other location in your project. Multiple message pattern processors are able to manage and filter the same request stream — yet decoupled. This lets you compose and pipe streams *dynamically* at runtime.

Set the broker's exchange into learning mode. Continue to develop your application. Then, when you're ready to publish, do a quick authorization review, then publish using the secure broker exchange. Since user authorization is based on message patterns, access to undefined collections becomes prohibited and access to resources for unauthorized users also gets locked down.

Versioning of message pattern processors is based on the exchange's configuration of the user sending the request — not the content of that sent message pattern.

### Key Features

- Send messages to the bus as a stream and process messages as a stream.
- Inject message processors to filter the stream from any location in your project to decouple concerns such as validation and transformation. (mutable composition for separation of concerns)
- Multiple message processors are able to process, filter, and transform a particular message request in a controlled, composed order.
- The secure messaging exchange learns authorization automatically (with exercise).
- Message processors may be versioned according to the connected user. Processor versions are dynamically substituted in the processor list upon each user's request. The broker exchange, not the sender, determines the processor version from the sending user's configuration.
- Property-based message patterns.
- A clean, concise, yet expressive API
- Few assumptions
   - Universal/isomorphic (in the browser and in Node.js)
   - The messaging scheme is totally open and configurable per processor and is not necessary predetermined to use wildcards or regular expressions for pattern matching. But you can. The default and intended scheme is to match multiple property/value pairs within an object.

### Quick Start

```
npm install godsend-examples
cd ./node_modules/godsend-examples/examples/storing-data
PORT=8082 node example.js
```

Initially, you likely want to install and run godsend-examples and not godsend itself. For now, please run each example from directly inside its own directory.
```
cd ./transforming-data/
PORT=8082 node example.js
```

### Starting the server

- You can start the server to run without configuring authorization.
- You might do this to get started quickly or to practice quickly.
- However, most software applications are going to require some authorization.

```javascript
new basic.Server({
  exchange : new godsend.Exchange.Open()
}).start(function() {
  console.log('The server has started.');
}.bind(this));
```

### Starting the server with authorization (preferred)

- This method requires that the server is provided with basic initial users to allow the authorizer and the broker to communicate on the bus.
- In the examples, the initial users "broker" and "authorizer" are supplied to the secure exchange from godsend-basics/src/users.json. But you can also customize these users and pass them into your own instance of the server manually.
- Also refer to godsend-examples for many more examples which use authorization.

```javascript
new basic.Server({
  address : 'http://127.0.0.1:8080/',
}).start(function() {
  new basic.Authorizer({
    address: 'http://127.0.0.1:8080/',
    users: this.users
  }).connect(function() {
    console.log('The server has started.');
  }.bind(this));
}.bind(this));
```

### Connecting to the bus without authorization

- Invoke godsend.connect and supply the broker address.
- Any subsequent calls to connection.send will queue until the connection is fully established.

```javascript
var connection = godsend.connect({
  address : 'http://127.0.0.1:8080/'
});
```

### Connecting to the bus with authorization

- Invoke godsend.connect and supply the broker address and credentials.
- Any subsequent calls to connection.send will queue until the connection is fully established.

```javascript
var connection = godsend.connect({
  address : 'http://127.0.0.1:8080/',
  credentials: {
    username: 'username',
    passphrase: 'passphrase',
  }
});
```

### Sending a simple request (non-streaming)

- Send a message over the bus by calling connection.send().
- The pattern can be any number of properties of a JSON object.
- The data is the content you wish to send. 
- "receive" is called when the request has finished. The result provides members of an "objects" array and an "errors" array. 

```javascript
connection.send({
  pattern: {
    action: 'message'
  },
  data : [{
    message : 'hello'
  }],
  receive: function(result) {
    console.log('The request has finished.');
    console.log('result.objects: ' + JSON.stringify(result.objects, null, 2));
    console.log('result.errors: ' + JSON.stringify(result.errors, null, 2));
  }.bind(this)
});
```

### Sending a streamed request

- Send a message over the bus by calling connection.send().
- The pattern can be any number of properties of a JSON object.
- The function "write" is called when the stream is ready for writing.
- The function "read" is called whenever the request has responded with an object.
- The function "error" is called whenever the request has responded with an error.
- Receive is called when the request has finished. The result provides members of an "objects" array and an "errors" array. 

```javascript
connection.send({
  pattern: {
    action: 'message'
  },
  write: function(stream) {
    stream.write({
      message: 'hello'
    });
    stream.write({
      message: 'world'
    });
    stream.end();
  }.bind(this),
  read: function(object) {
    console.log('read an response object: ' + JSON.stringify(object, null, 2));
  },
  error: function(error) {
    console.log('read an response error: ' + JSON.stringify(error, null, 2));
  },
  receive : function(result) {
    console.log('The request has finished.');
    console.log('result.objects: ' + JSON.stringify(result.objects, null, 2));
    console.log('result.errors: ' + JSON.stringify(result.errors, null, 2));
  }
});
```

### Processing requests

- You typically process messages using a connection in Node.js and not in the browser. (an exception is reacting to messages sent from the server)
- "id" can be used to name a processor to run a separate processor "before" or "after".
- "id" can also be used to group multiple versions of the same processor.
- "on" is called first to determine whether the processor ought to indeed process the request.
- Invoke request.accept({...}), request.skip, and/or request.matches({...}) to indicate a match.
- "run" is invoked upon each object processed by the stream.
- Stream.object is the current value.
- Call stream.push to proceed with the same value, different values entirely, or even omit the call to stream.push.
- Call stream.next to continue with the next processor.

```javascript
connection.mount({
  id: 'message',
  on: function(request) {
    request.accept({
      action: 'message'
    });
  }.bind(this),
  run: function(stream) {
    stream.push({
      reply : 'You said: ' + stream.object.message
    });
    stream.next();
  }.bind(this)
});
```

### Processing a sent request before a prior processor

- In this example, the processor "store-put-validate-task" would be processed before "store-put".
- When you have multiple processors in the same request, the accepted patterns do not have to match exactly.

```javascript
connection.mount({
  id: 'store-put-validate-task',
  before : 'store-put'
  on: function(request) {
    request.accept({
      topic : 'store',
      action: 'put',
      collection : 'task'
    });
  }.bind(this),
  run: function(stream) {
    if (valid) {
      stream.push(stream.object);
    } else {
      stream.err(stream.object);
    }
    stream.next();
  }.bind(this)
});
```

### Processing a sent request in between two other processors (before, and after).

- In this example, the processor "message" would be processed after "prior-processor" and before "next-processor".
- When you have multiple processors in the same request, the accepted patterns do not have to match exactly.

```javascript
connection.mount({
  id: 'message',
  after : 'prior-processor'
  before : 'next-processor'
  on: function(request) {
    request.accept({
      action: 'message'
    });
  }.bind(this),
  run: function(stream) {
    console.log('Logging the message: ' + JSON.stringify(stream.object, null, 2));
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

### Processing a sent request using processor weights

- You can add processors in order by weight.
- Negative weights are early.
- Positive weights are late.

```javascript
connection.mount({
  id: 'pre-process',
  weight : -100
  on: function(request) {
    request.accept();
  }.bind(this),
  run: function(stream) {
    console.log('Pre-processing pattern: ' + JSON.stringify(stream.request.pattern, null, 2));
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});

connection.mount({
  id: 'post-process',
  weight : 100
  on: function(request) {
    request.accept();
  }.bind(this),
  run: function(stream) {
    console.log('Post-processing pattern: ' + JSON.stringify(stream.request.pattern, null, 2));
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});

```

### Advanced processor request matching

You can describe request matching explicitly:

```javascript
connection.mount({
  id: 'message',
  on: function(request) {
    if (request.matches({
      action : 'message'
    })) {
      request.accept();
    } else {
      request.skip();
    }
  }.bind(this),
  run: function(stream) {
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

Or you can implement request matching logic yourself if you need to:

```javascript
connection.mount({
  id: 'message',
  on: function(request) {
    if (matches) {
      request.accept();
    } else {
      request.skip();
    }
  }.bind(this),
  run: function(stream) {
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

### Declaring different versions of a processor

- Processor versions are substituted based upon any versions defined within a user's profile.

```javascript
connection.mount({
  id: 'a-processor',
  version: {
    name: 'version-two',
    'default': true
  },
  on: function(request) {
    request.accept({
      topic: 'store',
      action: 'get'
    });
  }.bind(this),
  run: function(stream) {
    console.log('Getting data from the store. (v2 : default)');
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

### Processing outbound requests

- Outbound requests are processed before the sender's connection delivers data to the exchange.
- You could encrypt data or strip data by mounting an outbound processor.

```javascript
connection.mount({
  route : 'outbound'
  id: 'encypt',
  on: function(request) {
    request.accept({
      
    });
  }.bind(this),
  run: function(stream) {
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

### Processing inbound requests

- Inbound requests are processed after the exchange has returned a data to the sender's connection - but before the sender receives it. 
- You could decrypt data or update GUI aspects by mounting an inbound processor.

```javascript
connection.mount({
  route : 'inbound'
  id: 'decrypt',
  on: function(request) {
    request.accept({
      
    });
  }.bind(this),
  run: function(stream) {
    stream.push(stream.object);
    stream.next();
  }.bind(this)
});
```

### Learning exchange authorization

- The learning exchange will learn patterns issued by a sender, **only if** the receiver's processors modify at least one or more of the objects returned to that sender.
- If a receiver's processors do not modify or transform any of the objects from the sender, the **receivable** pattern will **not** be learned.

### Understand streaming in Godsend

- Suppose, first, that if you write objects to the bus, that these exact same objects get returned to the sender (echoed).
- Next, imagine the scenario that these objects are transformed (modified) before they get returned to the sender.
- Imagine, instead, the scenario that each object gets stored, is *not* returned, and a single aggregate response object is created and returned.
- The inverse of this is also possible: you send one object (a query, for example) and multiple objects get returned as a result.
- In summary, you use processors in Godsend to *transform* a request to become the response: many to many, one to one, one to many, or many to one.
- A request in Godsend can have many processors to working together to process the same request data. Fundamentally, this is why a transformation stream is used to transform a request into a response.

### Support

- This project has not been tested in a production environment. Security, error handling, and fault tolerance need more evaluation.
- If you encounter any issues installing, starting, or using Godsend, please email simplygreatwork@gmail.com. I will greatly appreciate your efforts. 

### Links

[Godsend Examples @ RunKit](https://www.notion.so/Examples-0ceecf7945ac4b198c340fbf36075cda)

[Godsend Wiki](https://www.notion.so/Messaging-30c17b4e590f44689d9571f1f1f690c0)

[Godsend Preview @ Cloud9](https://preview.c9users.io/simplygreatwork/godsend/godsend/)

[Godsend IDE @ Cloud9](https://ide.c9.io/simplygreatwork/godsend/)
