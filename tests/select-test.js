
//setup the environment similar to the actual app
require('./config/setup');

var should = require('should'),
    sys = require('sys'),
    Select = require('../system/select').Select,
    Collection = require('../system/collection').Collection,
    dbConfig = require('./config/db-cfg').config,
    Model = require('../system/collection').Model;


var domain = 'test-select';
dbConfig.name = 'default';


module.exports = {
    'should be instance of Select': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing');
            select.should.be.an.instanceof(Select);
            core.log('closing collection');
            coll.close(domain);
        });
    },  
    'should have 2 fields': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing fields');
            select.field('test').field('test2').fields.should.eql({test: true, test2: true});
            coll.close(domain);
        });
    },
    'tests skip': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing skip');
            select.skip(10).options.should.eql({skip: 10});
            coll.close(domain);
        });
    },
    'tests limit': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing limit');
            select.limit(10).options.should.eql({limit: 10});
            coll.close(domain);
        });
    },
    'tests sortAsc': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing sortAsc');
            select.sortAsc('test').options.should.eql({sort:[['test','asc']]});
            coll.close(domain);
        });
    },
    'tests sortDesc': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing sortDesc');
            select.sortDesc('test').options.should.eql({sort:[['test','desc']]});
            coll.close(domain);
        });
    },
    'tests multiple sort': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing sortAsc');
            select.sortAsc('test')
                .sortDesc('test2')
                .sortAsc('test3')
                .options
                .should
                .eql({sort:[['test','asc'],['test2','desc'],['test3','asc']]});
            coll.close(domain);
        });
    },
    'tests where': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing where');
            select.where('test = 3')
                .query
                .should
                .eql({test: 3});
            coll.close(domain);
        });
    },
    'tests where with and': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing where with and');
            select.where('test = 3')
                .and('test2 = some random string')
                .query
                .should
                .eql({test: 3,
                      test2: 'some random string'});
            coll.close(domain);
        });
    },
    'tests where with or': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing where with or');
            select.where('test = 3')
                .or('test2 = some random string')
                .query
                .should
                .eql({test: 3,
                    $or: [
                        {test2: 'some random string'}
                    ]
                });
            coll.close(domain);
        });
    },
    'tests in': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing in');
            select.in('test',[1,2,3,4])
                .query
                .should
                .eql({test: {$in: [1,2,3,4]}});
            coll.close(domain);
        });
    },
    'tests nin': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing nin');
            select.nin('test',[1,2,3,4])
                .query
                .should
                .eql({test: {$nin: [1,2,3,4]}});
            coll.close(domain);
        });
    },
    'tests all': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing all');
            select.all('test',[1,2,3,4])
                .query
                .should
                .eql({test: {$all: [1,2,3,4]}});
            coll.close(domain);
        });
    },
    'tests exists': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing exists');
            select.exists('test')
                .query
                .should
                .eql({test: {$exists: true}});
            coll.close(domain);
        });
    },
    'tests mod': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing mod');
            select.mod('test',10,3)
                .query
                .should
                .eql({test: {$mod: [10,3]}});
            coll.close(domain);
        });
    },
    'tests size': function(){
        var coll = new Collection(domain,dbConfig);
        coll.init().then(function(){
            var select = coll.getSelect();
            core.log('got select ... testing size');
            select.size('test',5)
                .query
                .should
                .eql({test: {$size: 5}});
            coll.close(domain);
        });
    },
    
};

