
//setup the environment similar to the actual app
require('./config/setup');

var should = require('should'),
    sys = require('sys'),
    Collection = require('../system/collection').Collection,
    dbConfig = require('./config/db-cfg').config,
    Select = require('../system/select').Select,
    Model = require('../system/model').Model;
    
core.debug('database config',dbConfig);

var domain = 'test';

dbConfig.name = 'default';

module.exports = {
    'should return the same document': function(){
        core.log('test: should return the same document');
        var coll = new Collection(domain,Model,dbConfig);
        coll.init().then(function(){
            core.log('in init callback for test: should return the same document');
            var obj = {
                _id: 'jnhgbfrdye65',
                test: 'test',
                test2: ['a','b','c']
            };
            coll.save(obj).then(function(result){
                core.log('in save callback for test: should return the same document');
                result.should.eql(obj);
                coll.close(domain);
            });
        });
    },
    'should return a saved document with an id': function(){
        core.log('test: should return a saved document with an id');
        var coll = new Collection(domain,Model,dbConfig);
        coll.init().then(function(){
            core.log('in init callback for test: should return a saved document with an id');
            var obj = {
                test: 'test',
                test2: ['a','b','c']
            };
            coll.save(obj).then(function(result){
                core.log('in save callback for test: should return a saved document with an id');
                result.should.have.property('_id');
                coll.close(domain);
            });
        });
    },
    'should be instance of Collection': function(){
        core.log('test: should be instance of Collection');
        var coll = new Collection(domain,Model,dbConfig);
        coll.init().then(function(){
            core.log('in init callback for test: should be instance of Collection');
            coll.should.be.an.instanceof(Collection);
            coll.close(domain);
        });
    },
    'should return an instance of Select': function(){
        core.log('test: should return an instance of Select');
        var coll = new Collection(domain,Model,dbConfig);
        coll.init().then(function(){
            core.log('in init callback for test: should return an instance of Select');
            coll.getSelect().should.be.an.instanceof(Select);
            coll.close(domain);
        });
    },
    'tests save, findOne, and remove': function(){
        core.log('test: tests save, findOne, and remove');
        var coll = new Collection(domain,Model,dbConfig);
        coll.init().then(function(){
            core.log('in init callback for test: tests save, findOne, and remove');
            
            //first save a record
            var obj = {
                test: 'test',
                test2: ['a','b','c']
            };
            coll.save(obj).then(function(result){
                core.log('testing _id property');
                result.should.have.property('_id');
                //then do a findOne based on _id
                return coll.findOne(result._id,{});
            }).then(function(result){
                //make sure we got a valid model back
                core.log('testing the return of a model instance from findOne()');
                result.should.be.an.instanceof(Model);
                //then remove it
                return coll.remove(result.getObject());
            }).then(function(count){
                core.log('testing that the count of removed records was 1');
                count.should.equal(1);
                coll.close(domain);
            });
            
        });
    },
    'should translate expression (field = value)': function(){
        core.log('test: should translate expression (field = value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field = value');
        obj.should.eql({field: 'value'});
    },
    'should translate expression (field != value)': function(){
        core.log('test: should translate expression (field != value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field != value');
        obj.should.eql({field: {$ne: 'value'}});
    },
    'should translate expression (field > value)': function(){
        core.log('test: should translate expression (field > value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field > value');
        obj.should.eql({field: {$gt: 'value'}});
    },
    'should translate expression (field < value)': function(){
        core.log('test: should translate expression (field < value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field < value');
        obj.should.eql({field: {$lt: 'value'}});
    },
    'should translate expression (field >= value)': function(){
        core.log('test: should translate expression (field >= value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field >= value');
        obj.should.eql({field: {$gte: 'value'}});
    },
    'should translate expression (field <= value)': function(){
        core.log('test: should translate expression (field <= value)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field <= value');
        obj.should.eql({field: {$lte: 'value'}});
    },
    'should translate expression (value1 < field < value2)': function(){
        core.log('test: should translate expression (value1 < field < value2)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('value1 < field < value2');
        obj.should.eql({field: {$gt: 'value1', $lt: 'value2'}});
    },
    'should translate expression (value1 >= field >= value2)': function(){
        core.log('test: should translate expression (value1 >= field >= value2)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('value1 >= field >= value2');
        obj.should.eql({field: {$gte: 'value2', $lte: 'value1'}});
    },
    'should translate "or" expression (field < value)': function(){
        core.log('test: should translate expression (value1 >= field >= value2)');
        var coll = new Collection(domain,Model,dbConfig);
        var obj = coll.translateExpression('field < value', true);
        obj.should.eql({$or: [ {field: {$lt: 'value'}}]});
    },
    'tests save, find, and remove': function(){
        core.log('test: tests save, findOne, and remove');
        var coll = new Collection(domain,Model,dbConfig),
            count = null;
        coll.init().then(function(){
            core.log('in init callback for test: tests save, findOne, and remove');
            
            //first save a record
            var obj = {
                test: 'test',
                test2: ['a','b','c']
            }, 
            obj2 = {
                test: 'test2',
                test2: ['d','e','f']
            };
            coll.save(obj).then(function(result){
                  return coll.save(obj2);  
            }).then(function(result){
                var s = coll.getSelect();
                return coll.find(s,{});
            }).then(function(results){
                //make sure we got a valid model back
                core.log('testing the return of a array of model instances from find()');
                results.should.be.an.instanceof(Array);
                results[0].should.be.an.instanceof(Model);
                count = results.length;
                //then remove them
                var i = [];
                results.each(function(res){
                   i.push(res._id); 
                });
                var query = coll.getSelect().in('_id',i);
                return coll.remove(query);
            }).then(function(count){
                core.log('testing that the count of removed records equals the # of records found');
                count.should.equal(count);
                coll.close(domain);
            });
            
        });
    },
};
