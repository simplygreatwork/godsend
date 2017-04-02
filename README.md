![Godsend Logo](https://s3-us-west-2.amazonaws.com/notion-static/a7b5b59c35b2480e90126eadd33cf81f/godsend.png "Godsend Logo")

# Godsend
A simple and eloquent workflow for streaming messages to micro-services.

[![Join the chat at https://gitter.im/godsendbus/Lobby](https://badges.gitter.im/godsendbus/Lobby.svg)](https://gitter.im/god-send/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

An important goal for Godsend is to ease your software development workflow without tedium. For example, quickly save data to any undefined collection during the development process. Go back later to add validation for a collection as a message pattern processor on the bus in any order from anywhere in your application at any time. Then, add a data transformation processor from some other location in your project. Multiple message pattern processors are able to manage and filter the same request stream — yet decoupled. This lets you compose and pipe streams *dynamically* at runtime.

Set the broker's exchange into learning mode. Continue to develop your application. Then, when you're ready to publish, do a quick authorization review, then publish using the secure broker exchange. Since user authorization is based on message patterns, access to undefined collections becomes prohibited and access to resources for unauthorized users also gets locked down. Versioning of message pattern processors is based on the exchange's configuration of the user sending the request — not the content of that sent message pattern.

### Key Features

- Streaming: send messages to the bus as a stream and process messages as a stream.
- Mutable composition: inject message processors to filter the stream from any location in your project to decouple concerns such as validation and transformation.
- Multiple message processors are able to process, filter, and transform a particular message request in a controlled, composed order.
- The secure messaging exchange learns authorization automatically (with exercise).
- Message processors may be versioned according to the connected user. Processor versions are dynamically substituted in the processor list upon each user's request. The broker exchange, not the sender, determines the processor version from the sending user's configuration.
- Property-based message patterns.
- A clean, concise, yet expressive API
- Few assumptions
   - Universal/isomorphic (in the browser and in Node.js)
   - The messaging scheme is totally open and configurable per processor and is not necessary predetermined to use wildcards or regular expressions for pattern matching. But you can. The default and intended scheme is to match multiple property/value pairs within an object.

### Support

If you encounter any issues installing, starting, or using Godsend, please email simplygreatwork@gmail.com. I would greatly appreciate it. 

### Online Examples

[Godsend Examples @ RunKit](https://www.notion.so/Examples-0ceecf7945ac4b198c340fbf36075cda)

### Getting Started

`npm install godsend-examples`

`cd ./node_modules/godsend-examples/examples/storing-data`

`PORT=8082 node example.js`

Initially, you likely want to install and run the godsend-examples and not godsend itself.

- IMPORTANT: Run each example from directly inside its own directory. (e.g. > cd ./transforming-data/  PORT=8082 node example.js)
- This project is not currently suitable for production.
- Security, error handling, and fault tolerance need more evaluation.

https://www.notion.so/Messaging-30c17b4e590f44689d9571f1f1f690c0

### Public Development @ Cloud9

[Cloud9 Preview](https://preview.c9users.io/simplygreatwork/godsend/godsend/)

[Sign-in | Cloud9 IDE - Ajax.org](https://ide.c9.io/simplygreatwork/godsend/)
