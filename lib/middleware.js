const mongojs = require('mongojs');
const populate = require('./populate');
const utils = require('./utils');

function getIdsFromList(data, attribute, isList) {
  if (Array.isArray(data)) {
    return data.map(function (item) {
      return utils.getNestedObject(item, attribute);
    });
  } else if (typeof data.results !== 'undefined') {
    return data.results.map(function (item) {
      return utils.getNestedObject(item, attribute);
    });
  } else {
    return data;
  }
}

function getIds(data, attribute, isList) {
  return (isList === true) ? getIdsFromList(data, attribute, isList) : utils.getNestedObject(data, attribute);
}

function setIdsToList(data, result, attribute, isList) {
if (Array.isArray(data)) {
    data.forEach(function (item, i) {
      if (result && result.length > i) {
        utils.setNestedObject(item, attribute, result[i]);
      }
    });
  } else if (typeof data.results !== 'undefined') {
    data.results.forEach(function (item, i) {
      if (result && result.length > i) {
        utils.setNestedObject(item, attribute, result[i]);
      }
    });
  }
}

function setIds(data, result, attribute, isList) {
  (isList === true) ? setIdsToList(data, result, attribute, isList) : utils.setNestedObject(data, attribute, result);
}

module.exports = function (resultKey) {

  this.populate = function (attribute, fields, isList) {
    return function (req, res, next) {
      var id = getIds(req[resultKey], attribute, isList);

      populate(id, attribute, (fields || {}), function (err, result) {
        if (err) {
          next(err);
        } else {
          setIds(req[resultKey], result, attribute, isList);
          next();
        }
      });
    }
  };
}
