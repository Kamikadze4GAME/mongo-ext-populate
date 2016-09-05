const mongojs = require('mongojs');
const populate = require('./populate');
const utils = require('./utils');

module.exports = function (resultKey) {

  this.populate = function (attribute, fields) {
    return function (req, res, next) {
      var id = utils.getNestedObject(req[resultKey], attribute);

      populate(id, attribute, (fields || {}), function (err, result) {
        if (err) {
          next(err);
        } else {
          req[resultKey] = result;
          utils.setNestedObject(req[resultKey], attribute, result);
          next();
        }
      });
    }
  };
}
