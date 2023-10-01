# eden-sdk-examples
Examples on how to use the @edenlabs/eden-sdk js module

1. Download or clone repository

2. Install dependencies
```
cd eden-sdk-examples

yarn install
```

4. Configure API Key/Secret in `init_eden.js`
```js
const apiKey = 'YOUR_API_KEY_HERE'; // NEVER PUBLISH YOUR KEY!
const apiSecret = 'YOUR_API_SECRET_HERE'; // NEVER PUBLISH YOUR SECRET!
```

3. Run examples from project root
```
node examples/generators/create.js
node examples/generators/list.js

node examples/tasks/get.js
node examples/tasks/list.js

node examples/uploads/image.js
...
```
  
