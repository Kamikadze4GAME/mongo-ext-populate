const populate = require('./lib/populate.js');
const middleware = require('./lib/middleware.js');

module.exports = {
  populate: populate,
  PopulateMiddleware: middleware,
  addListener: require('./lib/query.js')
}
