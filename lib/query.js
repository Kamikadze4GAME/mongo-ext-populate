'use strict';

const mongojs = require('mongojs');
const queue = require('./createQueue')();
const utils = require('./utils');


function performQuery(params, data, done) {
  var connectionString = params && params.connectionString;
  var collectionName = params && params.collection;

  if (typeof connectionString !== 'string') {
    throw new Error('connectionString must be a string');
  }
  if (typeof collectionName !== 'string') {
    throw new Error('collection must be a string');
  }

  var id = data && data.data && data.data.id;
  var fields = data && data.data && data.data.fields;

  var collection = mongojs(connectionString).collection(collectionName);

  if (Array.isArray(id)){
    let ids = id.map(function (item) {
      return mongojs.ObjectId(item);
    });

    collection.find({_id: {$in: ids}}, (fields || {}), function (err, docs) {
      err ? done(err) : done(null, docs);
    });
  } else {
    collection.findOne({_id: mongojs.ObjectId(id)}, (fields || {}), function (err, doc) {
      err ? done(err) : done(null, doc);
    });
  }
}


function addListener(name, params, callback) {
  var cb = typeof callback === 'function' ? callback : function () {};

  if (!queue) {
    cb('Queue not available');
    return;
  }

  queue.process(utils.getName(name), function (job, done) {
    performQuery(params, job.data, done);
  });

  cb(null, 'Callback registered');
}

module.exports = addListener;
