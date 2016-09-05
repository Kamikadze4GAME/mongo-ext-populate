const kue = require('kue');

module.exports = function () {
  if (!process.env.KUE_REDIS_HOST) {
    return;
  }

  return kue.createQueue({
    redis: {
      port: process.env.KUE_REDIS_PORT || 6379,
      host: process.env.KUE_REDIS_HOST || '127.0.0.1',
      auth: process.env.KUE_REDIS_AUTH || '',
      db: process.env.KUE_REDIS_DB_NAME || 'kue'
    }
  });
}
