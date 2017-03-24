# Godsend
Simple and elegant messaging for microservices

The current version (0.2.0) now supports message streaming. As of March 23/2017, version 0.2.0 has not yet been published to NPM.

### Key Features

- Streaming: send messages to the bus as a stream and process messages as a stream.
- Mutable composition: inject message processors from any location in your project to decouple concerns such as validation and transformation.
- Multiple message processors are able to process, filter, and transform a particular message request in a controlled, composed order.
- The secure messaging exchange learns authorization automatically (with exercise).
- Message processors may be versioned according to the connected user. Processor versions are dynamically substituted in the processor list upon each user's request.
- Property-based message patterns.
- A clean, concise, yet expressive API
- Few assumptions
   - Universal/isomorphic (in the browser and in Node.js)
   - The messaging scheme is totally open and configurable per processor and is not necessary predetermined to use wildcards or regular expressions for pattern matching. But you can. The default and intended scheme is to match multiple property/value pairs within an object.

### Getting Started

`npm install godsend`

`npm install godsend-examples`

To get started, you likely want to install and run the godsend-examples and initially not godsend itself.

https://www.notion.so/Messaging-30c17b4e590f44689d9571f1f1f690c0

- This project is not currently suitable for production.
- Security, error handling, and fault tolerance need more evaluation.

### Public Development @ Cloud9

[Cloud9 Preview](https://preview.c9users.io/philmaker/messaging/godsend/)

[Sign-in | Cloud9 IDE - Ajax.org](https://ide.c9.io/philmaker/messaging)

### Examples

### Create a bus to be able to connect to the broker

```javascript
this.bus = new Bus({
   address : 'http://127.0.0.1:8080'
});
```

### Connect to the broker initially as a public user

```javascript
this.bus.connect({
   credentials : {
      username : 'client-public',
      passphrase : ''
   },
   responded : function(result) {
      this.connection = result.connection;
      this.process();
   }.bind(this)
});
```

### Change the credentials to become an admin user 

```javascript
this.connection.send({
   pattern : {
      topic : 'signin'
   },
   data : {
      credentials : {
         username : 'client-admin',
         passphrase : Utility.digest('passphrase-to-hash')
      }
   },
   received : function(result) {
      this.console.log('Result after attempting to sign in: ' + JSON.stringify(result.objects));
      sequence.next();
   }.bind(this)
});
```

### Create a new user which defines the user's authorized capabilities

```javascript
this.connection.send({
   pattern : {
      topic : 'store',
      action : 'put',
      collection : 'users'
   },
   data : {
      key : 'client-alpha',
      value : {
         credentials : {
            username : 'client-alpha',
            passphrase : Utility.digest('passphrase-to-hash')
         },
         patterns : {
            sendable : [{
               topic : 'register'
            }, {
               topic : 'signin'
            }, {
               topic : 'signout'
            }, {
               topic : 'store',
               action : 'find',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'put',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'get',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'create',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'read',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'update',
               collection : 'tasks'
            }, {
               topic : 'store',
               action : 'delete',
               collection : 'tasks'
            }],
            receivable : []
         }
      }
   },
   received : function(result) {
      this.console.log('Added a new user: ' + JSON.stringify(result.objects));
      sequence.next();
   }.bind(this)
});
```

### Intercept and validate the request to store a user by validating the request data

```javascript
this.connection.process({
   id : 'store-validate-user',
   before : 'store-put',
   on : function(request) {
      request.accept({
         topic : 'store',
         action : 'put',
         collection : 'users'
      });
   },
   run : function(stream) {
      if (valid) {
         stream.push(stream.object);
         stream.next();
      } else {
         stream.err({
            error : 'The user is invalid.'
         });
         stream.next();
      }
   }.bind(this)
});
```

### Spawn a new client connection as a public user

```javascript
this.bus.connect({
   credentials : {
      username : 'client-public',
      passphrase : ''
   },
   responded : function(result) {
      this.connection = result.connection;
      this.process();
   }.bind(this)
});
```

### Change the client connection's credentials to become the newly created user 

```javascript
this.connection.send({
   pattern : {
      topic : 'signin'
   },
   data : {
      credentials : {
         username : 'client-alpha',
         passphrase : ''
      }
   },
   received : function(result) {
      this.console.log('Client result after attempting to signin: ' + JSON.stringify(result.objects));
      sequence.next();
   }.bind(this)
});
```

### Send a message to store a task

```javascript
this.connection.send({
   pattern : {
      topic : 'store',
      action : 'put',
      collection : 'tasks'
   },
   data : {
      key : uuid.v4(),
      value : {
         subject : 'New Task'
      }
   },
   received : function(result) {
      this.console.log('Client result after attempting to put a new task: ' + JSON.stringify(result.objects));
      this.task = result.objects[0];
      this.console.log('This is the new task: ' + JSON.stringify(this.task.value));
      sequence.next();
   }.bind(this)
});
```

### Receive a message to store data to any named collection

```javascript
this.connection.process({
   id : 'store-put',
   on : function(request) {
      request.accept({
         topic : 'store',
         action : 'put'
      })
   }.bind(this),
   run : function(stream) {
      storage.put({
         collection : stream.request.pattern.collection,
         key : stream.object.key,
         value : stream.object.value,
         callback : function(properties) {
            stream.push({
               key : stream.object.key,
               value : stream.object.value
            });
            stream.next();
         }.bind(this)
      });
   }.bind(this)
});
```
   
### Filter the request to store any data by adding a creation date or modification date

The property `before` inserts the processor to execute before the data is stored.

```javascript
this.connection.process({
   id : 'store-transform-date',
   before : 'store-put',
   on : function(request) {
      request.accept({
         topic : 'store',
         action : 'put'
      })
   },
   run : function(stream) {
      storage.get({
         collection : stream.request.pattern.collection,
         key : stream.object.key,
         callback : function(properties) {
            if (properties.value) {
               stream.object.value.modified = new Date();
            } else {
               stream.object.value.created = new Date();
            }
            stream.push(stream.object);
            stream.next();
         }.bind(this)
      });
   }.bind(this)
});

```
### Filter a request to store task data by validating the request's data

```javascript
this.connection.process({
   id : 'store-validate-task',
   before : 'store-put',
   on : function(request) {
      request.accept({
         topic : 'store',
         action : 'put',
         collection : 'tasks'
      })
   },
   run : function(stream) {
      if (valid) {
         stream.push(stream.object);
      } else {
         stream.err{
            error : 'The task is invalid.'
         });
      }
      stream.next();
   }.bind(this)
});
```

### Send a request for a particular version of a processor

### Broadcast changes in real time after altering data in storage

Add a processor to run `after` data has been put in a storage collection.

### Mutate a received request and resend to a new route pattern on the bus

### Clone a received request, mutate, and resend to a new route pattern on the bus

### Clone a received request, mutate, and resend to a new route pattern on a different bus

