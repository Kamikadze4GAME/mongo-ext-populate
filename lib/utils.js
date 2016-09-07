'use strict';

const bson = require('bson');

/**
 * Check if a string is a valid Mongo ObjectId
 */
function isValidId (id) {
  if (typeof id === 'string') {
    return !!id.match(/^[0-9a-fA-F]{24}$/);
  } else if (typeof id === 'object') {
    return bson.ObjectId.isValid(id);
  }

  return false;
}


/**
 * Get queue name
 */
function getName(name) {
  return 'populate.' + name;
}


/**
 * Get nested object by key
 * @returns {string|object}
 */
function getNestedObject(o, key) {
  if (key.indexOf('.') < 0) {
    return typeof o === 'object' ? o[key] : undefined;
  }

  key = key.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  key = key.replace(/^\./, '');           // strip a leading dot

  var a = key.split('.');

  for (let i = 0, n = a.length; i < n; i += 1) {
    var k = a[i];

    if (k in o) {
      o = o[k];
    } else {
      return;
    }
  }

  return o;
};


/**
 * Set nested object by key
 */
function setNestedObject(o, key, value) {
  if (key.indexOf('.') < 0) {
    if (typeof o === 'object') {
      o[key] = value;
    }
    return;
  }

  var pList = key.split('.');
  var len = pList.length;

  for(var i = 0; i < len-1; i += 1) {
    let elem = pList[i];
    if(!o[elem]) o[elem] = {}
    o = o[elem];
  }

  return o[pList[len-1]] = value;
};


module.exports = {
  getName: getName,
  getNestedObject: getNestedObject,
  isValidId: isValidId,
  setNestedObject: setNestedObject
}
