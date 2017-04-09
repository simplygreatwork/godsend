![Godsend Logo](https://s3-us-west-2.amazonaws.com/notion-static/a7b5b59c35b2480e90126eadd33cf81f/godsend.png "Godsend Logo")

# Godsend
A simple and eloquent workflow for streaming messages to micro-services.

[![Join the chat at https://gitter.im/godsendbus/Lobby](https://badges.gitter.im/godsendbus/Lobby.svg)](https://gitter.im/god-send/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An important goal for Godsend is to ease your software development workflow without tedium. For example, quickly save data to any undefined collection during the development process. Go back later to add validation for a collection as a message pattern processor on the bus in any order from anywhere in your application at any time. Then, add a data transformation processor from some other location in your project. Multiple message pattern processors are able to manage and filter the same request stream — yet decoupled. This lets you compose and pipe streams *dynamically* at runtime.

Set the broker's exchange into learning mode. Continue to develop your application. Then, when you're ready to publish, do a quick authorization review, then publish using the secure broker exchange. Since user authorization is based on message patterns, access to undefined collections becomes prohibited and access to resources for unauthorized users also gets locked down. Versioning of message pattern processors is based on the exchange's configuration of the user sending the request — not the content of that sent message pattern.

### Key Features

- Send messages to the bus as a stream and process messages as a stream.
- Inject message processors to filter the stream from any location in your project to decouple concerns such as validation and transformation. (mutable composition)
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

### Starting the server securely (preferred)

- The method requires that a the authorizer is provided and provides basic users.
- Refer to the godsend-examples for many examples with authorization.

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

```javascript
new godsend.Bus({
  address : 'http://127.0.0.1:8080/',
}).connect({
  initialized : function(connection) {
    // this.process(connection);
    // add message processors to the connection here;
  }.bind(this),
  connected: function(connection) {
    callback();
  }.bind(this),
  errored : function(errors) {
    console.error('connection errors: ' + errors);
    callback(errors);
  }.bind(this)
});
```

### Connecting to the bus using authorization

- Create the bus and supply the address with which to connect.
- Connect to the bus by supplying credentials and any of several handlers (as follows).
- The credentials should match credentials provided by the server's (the broker's) authorizer.
- "initialized" is called to allow you to register processors; e.g. connection.process({...})
- "connected" is called after the connection to the bus was successfully established.
- "errored" is called if a connection to the bus could not be established.
- Before connecting to an authorized bus, you must start the server/broker by supplying authorized users.

```javascript
new godsend.Bus({
  address : 'http://127.0.0.1:8080/',
}).connect({
  credentials: {
    username: 'username',
    passphrase: 'passphrase',
  },
  initialized : function(connection) {
    this.process(connection);
  }.bind(this),
  connected: function(connection) {
    this.connection = connection;
    callback();
  }.bind(this),
  errored : function(errors) {
    console.error('connection errors: ' + errors);
    callback(errors);
  }.bind(this)
});
```

### Sending a quick message (non-streaming)

- Send a message over the bus by calling connection.send().
- The pattern can be any number of properties of a JSON object.
- The data is the content you wish to send. 
- "receive" is called when the request has finished. The result provides members of an "objects" array and an "errors" array. 

```javascript
connection.send({
  pattern: {
    action: 'message'
  },
  data : {
    message : 'hello'
  },
  receive: function(result) {
    console.log('result: ' + JSON.stringify(result, null, 2));
  }.bind(this)
});
```

### Sending a streamed message

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
    console.log('The request has finished');
  }
});
```

### Processing sent messages

- You typically process messages using a connection in Node.js and not in the browser. (an exception is reacting to messages sent from the server)
- "id" can be used to name a processor to later run a separate processor "before" or "after".
- "id" can also be used to group multiple versions of the same processor.
- "on" is called first to determine whether the processor ought to indeed process the request.
- Invoke request.accept({...}), request.skip, and/or request.matches to indicate a match.
- "run" is invoked upon each object processed by the stream.
- Stream.object is the current value.
- Call stream.push to proceed with the same value, a different value entirely, or even omit the call to stream.push.
- Call stream.next to continue with the next processor.

```javascript
connection.process({
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

### Processing a sent message after another processor

- In this example, processor "message-after" will execute after "message".
- When you use multiple processors for a single request, the accepted patterns do not have to match exactly.

```javascript
connection.process({
  id: 'message-after',
  after : 'message'
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

### Advanced processor request matching

You can describe request matching explicitly:

```javascript
connection.process({
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
connection.process({
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


### Support

- This project has not been tested in a production environment. Security, error handling, and fault tolerance need more evaluation.
- If you encounter any issues installing, starting, or using Godsend, please email simplygreatwork@gmail.com. I will greatly appreciate your efforts. 

### Links

[Godsend Examples @ RunKit](https://www.notion.so/Examples-0ceecf7945ac4b198c340fbf36075cda)

[Godsend Wiki](https://www.notion.so/Messaging-30c17b4e590f44689d9571f1f1f690c0)

[Godsend Preview @ Cloud9](https://preview.c9users.io/simplygreatwork/godsend/godsend/)

[Godsend IDE @ Cloud9](https://ide.c9.io/simplygreatwork/godsend/)
