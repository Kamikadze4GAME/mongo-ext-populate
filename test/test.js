process.env.NODE_ENV = 'test';

require('dotenv').config({
  path: '.env' + (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : '')
});

var chai = require('chai');
var should = chai.should();
var mongojs = require('mongojs');
var faker = require('faker');

var httpMocks = require('node-mocks-http'),
  req = {},
  res = {};

var connectionString = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME;
var collection = mongojs(connectionString).collection('test');

var addListener = require('./../lib/query');
var populate = require('./../lib/populate');
var middleware = require('./../lib/middleware');

var resultKey = 'response';
var data;


describe('External populate: ', function () {
  collection.drop();

  beforeEach(function (done) {
    data = [
      {
        _id: mongojs.ObjectId('56ab3b913d99cfb631144c70'),
        name: faker.name.findName(),
        email: faker.internet.email()
      },
      {
        _id: mongojs.ObjectId('56ab3b913d99cfb631144c71'),
        name: faker.name.findName(),
        email: faker.internet.email()
      }
    ];


    collection.insert(data, function () {
      done();
    });
  });

  afterEach(function (done) {
    collection.drop();
    done();
  });

  it('should add listener', function (done) {
    addListener('listenerName', {}, function (err) {
      if (err) {
        throw new Error('Expected not to receive an error');
      }

      done();
    });
  });

  describe('Populate function: ', function () {
    addListener('test', {connectionString: connectionString, collection: 'test'});

    it('should populate by a single id', function (done) {
      populate(data[0]._id, 'test', {}, function (err, result) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        result.name.should.equal(data[0].name);
        result.email.should.equal(data[0].email);
        done();
      });
    });

    it('should populate some fields by a single id', function (done) {
      populate(data[0]._id, 'test', {name: 1}, function (err, result) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        result.name.should.equal(data[0].name);
        should.not.exist(result.email);
        done();
      });
    });

    it('should populate by multiple ids', function (done) {
      populate([data[0]._id, data[1]._id], 'test', {}, function (err, results) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        results.should.have.length(2);
        results[0].name.should.equal(data[0].name);
        results[0].email.should.equal(data[0].email);
        results[1].name.should.equal(data[1].name);
        results[1].email.should.equal(data[1].email);
        done();
      });
    });

    it('should populate some fields by multiple ids', function (done) {
      populate([data[0]._id, data[1]._id], 'test', {name: 1}, function (err, results) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        results.should.have.length(2);
        results[0].name.should.equal(data[0].name);
        should.not.exist(results[0].email);
        results[1].name.should.equal(data[1].name);
        should.not.exist(results[1].email);
        done();
      });
    });
  });

  describe('Populate middleware: ', function () {
    var ExternalPopulate;

    addListener('test', {connectionString: connectionString, collection: 'test'});

    beforeEach(function (done) {
      req = httpMocks.createRequest({
        method: 'GET',
        url: '/test/path'
      });

      res = httpMocks.createResponse();

      ExternalPopulate = new middleware('resultKey');
      done();
    });

    it('should populate by a single id', function (done) {
      req.resultKey = {
        test: data[0]._id
      };

      ExternalPopulate.populate('test')(req, res, function next (err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.test.name.should.equal(data[0].name);
        req.resultKey.test.email.should.equal(data[0].email);
        done();
      });
    });

    it('should populate some fields by a single id', function (done) {
      req.resultKey = {
        test: data[0]._id
      };

      ExternalPopulate.populate('test', {name: 1})(req, res, function next (err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.test.name.should.equal(data[0].name);
        should.not.exist(req.resultKey.test.email);
        done();
      });
    });

    it('should populate by multiple ids', function (done) {
      req.resultKey = {
        test: [data[0]._id, data[1]._id]
      };

      ExternalPopulate.populate('test')(req, res, function (err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.test.should.have.length(2);
        req.resultKey.test[0].name.should.equal(data[0].name);
        req.resultKey.test[0].email.should.equal(data[0].email);
        req.resultKey.test[1].name.should.equal(data[1].name);
        req.resultKey.test[1].email.should.equal(data[1].email);
        done();
      });
    });

    it('should populate some fields by multiple ids', function (done) {
      req.resultKey = {
        test: [data[0]._id, data[1]._id]
      };

      ExternalPopulate.populate('test', {name: 1})(req, res, function next (err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.test.should.have.length(2);
        req.resultKey.test[0].name.should.equal(data[0].name);
        should.not.exist(req.resultKey.test[0].email);
        req.resultKey.test[1].name.should.equal(data[1].name);
        should.not.exist(req.resultKey.test[1].email);
        done();
      });
    });

    it('should populate a list of objects', function (done) {
      req.resultKey = [
        {
          test: data[0]._id
        },
        {
          test: data[1]._id
        },
        {
          test: [data[0]._id, {foo: 'bar'}, data[1]._id]
        }
      ];

      ExternalPopulate.populate('test', {_id: 0}, true)(req, res, function next(err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.should.to.deep.equal([
          {
            test: {
              name: data[0].name,
              email: data[0].email
            }
          },
          {
            test: {
              name: data[1].name,
              email: data[1].email
            }
          },
          {
            test: [
              {
                name: data[0].name,
                email: data[0].email
              },
              {foo: 'bar'},
              {
                name: data[1].name,
                email: data[1].email
              }
            ]
          }
        ]);
        done();
      });
    });

    it('should populate a list of paginates objects', function (done) {
      req.resultKey = {
        results: [
          {
            test: data[0]._id
          },
          {
            test: data[1]._id
          },
          {
            test: [data[0]._id, {foo: 'bar'}, data[1]._id]
          }
        ]
      };

      ExternalPopulate.populate('test', {_id: 0}, true)(req, res, function next(err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.results.should.to.deep.equal([
          {
            test: {
              name: data[0].name,
              email: data[0].email
            }
          },
          {
            test: {
              name: data[1].name,
              email: data[1].email
            }
          },
          {
            test: [
              {
                name: data[0].name,
                email: data[0].email
              },
              {foo: 'bar'},
              {
                name: data[1].name,
                email: data[1].email
              }
            ]
          }
        ]);
        done();
      });
    });

    it('should populate only valid ids of a list', function (done) {
      req.resultKey = [
        {
          test: null
        },
        {
          test: {foo: 'bar'}
        },
        {
          test: data[1]._id
        },
        {
          test: [data[0]._id, {foo: 'bar'}, data[1]._id]
        }
      ];

      ExternalPopulate.populate('test', {_id: 0}, true)(req, res, function next(err) {
        if (err) {
          throw new Error('Expected not to receive an error');
        }

        req.resultKey.should.to.deep.equal([
          {
            test: null
          },
          {
            test: {foo: 'bar'}
          },
          {
            test: {
              name: data[1].name,
              email: data[1].email
            }
          },
          {
            test: [
              {
                name: data[0].name,
                email: data[0].email
              },
              {foo: 'bar'},
              {
                name: data[1].name,
                email: data[1].email
              }
            ]
          }
        ]);
        done();
      });
    });
  });
});
