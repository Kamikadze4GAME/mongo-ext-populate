# NodeJS MongoDB external populate for microservices

A MongoDb attribute population between different microservices, performed by [kue library](https://github.com/Automattic/kue). 

## Installation

```
npm install mongo-ext-populate --save
```

Add to your project's **.env** file the variables like in the example (**.env.sample**).

## Usage

### Microservice A

The microservice A must call the function ```addListener``` to be notified when it has to make a query to populate an attribute.

```js
var extPopulate = require('mongo-ext-populate');

var name = 'key';     //key (eg. attribute name)
var params = {
  connectionString: 'mongodb://localhot:27017/db-name',     //connection string to database
  collection: 'collectionName'    //collection name
}

extPopulate.addListener(name, params, function (err, response) {
  console.log(response); // "Callback registered"
});
```

### Microservice B

The microservice B may request an attribute population by using:

* a function with callback
* an Express middleware

#### Function

```js
var extPopulate = require('mongo-ext-populate');

var id = '1';     //MongoDb ID or array of IDs
var attribute = 'key';     //equals to "name" attribute used by microservice A
var fields = {attr1: 1, attr2: 1, attr3: 0}    //fields

extPopulate.populate(id, attribute, fields, function (err, result) {
  //result is the populated object (or array of objects)
});
```

#### Middleware

```js
var extPopulate = require('mongo-ext-populate');
var express = require('express');
var router = express.Router();

var resultKey = 'key';
var ExtPopulate = new extPopulate(resultKey);

var attribute = 'key';     //equals to "name" attribute used by microservice A
var fields = {attr1: 1, attr2: 1, attr3: 0}    //fields selection


router.route('/api-route')
  .get(
    function (req, res, next) {
      res[resultKey] = '1' //id to be populates
    },
    ExtPopulate.populate(attribute, fields),
    function (req, res, next) {
      //res[resultKey] now contains the populated object
    },
    //other middlewares...
  )

```

## Test

### Setup

* Create **.env.test** file (copy and rename .env.sample).
* Create **logs/test.log file**.

### Run tests
```
npm test
```

### Coverage

```
npm run-script test-travis
```

## License

[MIT license](LICENSE)
