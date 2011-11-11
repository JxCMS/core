
//setup the environment similar to the actual app
require('./config/setup');

var should = require('should'),
    sys = require('sys'),
    Model = require('../system/model').Model;
    
module.exports = {
    'should be instance of model': function(){
        var model = new Model();
        model.should.be.an.instanceof(Model);
    },
    'should return an empty object': function(){
        var model = new Model();
        model.getObject().should.eql({});
    },
    'should return the same object': function(){
        logger.log('this is the third model test');
        var obj = {
            test: 'test',
            test2: 143
        },
        model = new Model(obj);
        model.getObject().should.eql(obj);
    },
    'test changing the properties': function(){
        var obj = {
            test: 'test',
            test2: 143
        },
        model = new Model(obj);
        model.test2 = 189;
        obj.test2 = 189;
        model.getObject().should.eql(obj);
    },
    'test adding properties': function(){
        var obj = {
            test: 'test',
            test2: 143
        },
        model = new Model(obj);
        model.test3 = 'a new property';
        model.getObject().should.not.eql(obj);
        obj.test3 = 'a new property';
        model.getObject().should.eql(obj);
    },
    'test nested objects': function(){
        var obj = {
            test: 'test',
            test2: {
                sub: 143
            }
        },
        model = new Model(obj);
        model.getObject().should.eql(obj);
        model.should.have.property('test2')
        model.test2.should.eql(obj.test2);
        model.test2.sub.should.eql(obj.test2.sub);
    },
    'test changing a nested object': function(){
        var obj = {
            test: 'test',
            test2: {
                sub: 143
            }
        },
        model = new Model(obj);
        model.getObject().should.eql(obj);
        model.should.have.property('test2')
        model.test2.should.eql(obj.test2);
        model.test2.sub.should.eql(obj.test2.sub);
        model.test2.sub = 'a changed subproperty';
        model.test2.sub.should.not.eql(obj.test2.sub);
        obj.test2.sub = 'a changed subproperty';
        model.test2.sub.should.eql(obj.test2.sub);
        model.getObject().should.eql(obj);
    },
    'test nested array': function(){
        var obj = {
            test: 'test',
            test2: ['a','b','c']
        },
        model = new Model(obj);
        model.getObject().should.eql(obj);
        model.should.have.property('test2')
        model.test2.should.eql(obj.test2);
        model.test2[1].should.eql(obj.test2[1]);
    },
    'test changing a nested array': function(){
        var obj = {
            test: 'test',
            test2: ['a','b','c']
        },
        model = new Model(obj);
        model.getObject().should.eql(obj);
        model.should.have.property('test2')
        model.test2.should.eql(obj.test2);
        model.test2[1].should.eql(obj.test2[1]);
        model.test2[1] = 'a changed subproperty';
        model.test2[1].should.not.eql(obj.test2[1]);
        obj.test2[1] = 'a changed subproperty';
        model.test2[1].should.eql(obj.test2[1]);
        model.getObject().should.eql(obj);
    },
    'object should return _id': function(){
        var obj = {
            _id: 'lenchc93hjdf',
            test: 'test',
            test2: ['a','b','c']
        },
        model = new Model(obj); 
        model.getObject().should.eql(obj);
    },
    'object should return _id after having it set': function(){
        var obj = {
            test: 'test',
            test2: ['a','b','c']
        },
        model = new Model(obj); 
        model._id = 'lenchc93hjdf';
        obj._id = 'lenchc93hjdf';
        model.getObject().should.eql(obj);
    }
};
