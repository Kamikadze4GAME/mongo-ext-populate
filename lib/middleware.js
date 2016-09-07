'use strict';

const mongojs = require('mongojs');
const logger = require('./logger');
const populate = require('./populate');
const utils = require('./utils');

/**
 * Get array of data from a list or a paginated object
 */
function getItemsFromList(data) {
  if (Array.isArray(data)) {
    return data;
  } else if (typeof data.results !== 'undefined') {
    return data.results;
  }

  return [];
}

/**
 * Get ID to populate only if it's valid
 */
function getValidId(data, attribute) {
  var id = utils.getNestedObject(data, attribute);

  if (Array.isArray(id)) {
    return id.filter(function (item) {
      return utils.isValidId(item);
    });
  }

  return utils.isValidId(id) ? id: null;
}

/**
 * Get only valid IDs to populate from a list of data
 */
function getValidIdsFromList(data, attribute) {
  var ids = getItemsFromList(data).map(function (item) {
    return getValidId(item, attribute);
  }).filter(function (item) {
    return !!item;
  });

  //Flatten array and remove duplicates (ES6)
  return Array.from(new Set([].concat.apply([], ids)));
}

/**
 * Get IDs to populate
 */
function getIds(data, attribute, isList) {
  return (isList === true) ? getValidIdsFromList(data, attribute) : getValidId(data, attribute);
}

/**
 * Find a result by id
 */
function findInResults(results, id) {
  if (!id || typeof id.toString !== 'function') {
    return;
  }
  if (!Array.isArray(results)) {
    return results;
  }

  var result = results.find(function (result) {
    return result && result._id === id.toString();
  });

  return result ? Object.assign({}, result) : null;
}

/**
 * Get populated objects by IDs
 */
function getPopulatedObjects(itemId, results, showIdInResults) {
  return itemId.map(function (itmId, i) {
    var result = findInResults(results, itmId);

    if (!result || Object.keys.length === 0) {
      return itmId;
    }
    if (!showIdInResults) {
      delete result._id;
    }

    return result;
  });
}

/**
 * Replace ID with populated object
 */
function replaceId(item, attribute, results, showIdInResults) {
  var result;

  if (!results) {
    return;
  }

  var itemId = utils.getNestedObject(item, attribute);

  if (Array.isArray(itemId)) {
    result = getPopulatedObjects(itemId, results, showIdInResults);
  } else {
    result = findInResults(results, itemId);

    if (!result || Object.keys.length === 0) {
      return;
    }
    if (!showIdInResults) {
      delete result._id;
    }
  }

  utils.setNestedObject(item, attribute, result);
}

/**
 * Replace IDs with populated objects in a list of data
 */
function replaceIdsInList(list, results, attribute, showIdInResults) {
  if (!results || !Array.isArray(results)) {
    return;
  }

  getItemsFromList(list).forEach(function (item) {
    if (item) {
      replaceId(item, attribute, results, showIdInResults);
    }
  });
}

/**
 * Replace ID or IDs with populated object or objects
 */
function replaceIds(data, results, attribute, isList, showIdInResults) {
  isList === true ? replaceIdsInList(data, results, attribute, showIdInResults) : replaceId(data, attribute, results, showIdInResults);
}

/**
 * Middleware module
 */
module.exports = function (resultKey) {

  this.populate = function (attribute, fields, isList) {
    return function (req, res, next) {
      var id = getIds(req[resultKey], attribute, isList);
      var showIdInResults = !fields || fields._id !== 0;

      if (!id || id.length === 0) {
        return next();
      }

      fields = fields || {};
      fields._id = 1;
      fields = Object.keys(fields).length === 1 ? {} : fields;

      populate(id, attribute, fields, function (err, results) {
        if (err) {
          logger.error(err);
        } else {
          replaceIds(req[resultKey], results, attribute, isList, showIdInResults);
        }

        next();
      });
    }
  };
}
