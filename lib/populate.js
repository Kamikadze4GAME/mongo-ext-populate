const queue = require('./createQueue')();
const utils = require('./utils');

function populate(id, attribute, fields, callback) {
  var cb = typeof callback === 'function' ? callback : function () {};

  if (typeof attribute !== 'string') {
    throw new Error('attribute must be a string');
  }
  if (typeof fields !== 'function' && typeof fields !== 'object') {
    throw new Error('fields must be an object');
  }

  if (!queue) {
    cb('Queue not available');
    return;
  }

  var job = queue.create(utils.getName(attribute), {
    data: {
      id: id,
      attribute: attribute,
      fields: fields
    }
  }).removeOnComplete(true).attempts(3).save((err) => {
    if (err) {
      cb(err);
    }
  });

  job.on('complete', function (result) {
    cb(null, result);
  }).on('failed', function (errorMessage) {
    cb(errorMessage);
  });
}

module.exports = populate;
