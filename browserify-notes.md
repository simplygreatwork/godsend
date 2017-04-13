```
npm install --g browserify
cd godsend
npm install .
browserify src/main-browserify.js --standalone godsend > dist/godsend-client.js
```
