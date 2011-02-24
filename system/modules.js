var router = require('router').Router,
    sys = require('sys'),
    fs = require('fs-promise'),
    p = require('path'),
    Promise = require('promise').Promise;

//let's test the events..
core.addEvent('routeAdded', function(){sys.log('caught routeAdded event in module');});

core.log('in modules.js');

//load model
require('modules.model');


exports.init = function(db, domain, router){
    var promise = new Promise();
    
    core.log('In Modules.init() for ' + domain);
    var Module = db.model('Module');
    
    Module.find({}, function(err, docs){
        if (err) {
            promise.resolve(err);  //???? is this the right way to indicate the error   
        } else if (docs.length > 0) {
            core.log('docs returned: ' + sys.inspect(docs));
            docs.each(function(mod){
                if (mod.activated) {
                    if (mod.permanent) {
                        //this is a system module
                        core.log('get system modules for ' + domain);
                        fs.realpath('./modules/').then(function(path){
                            return require(path+ '/' + mod.get('name') + '/' + mod.get('name')).init(db, router);
                        },function(err){
                            core.debug('error from finding a system module path', err);
                        });
                    } else {
                        core.log('get domain specific modules for ' + domain);
                        //this is a domain specific module
                        fs.realpath('domains/' + domain + '/modules/').then(function(path){
                            return require( path + '/' + mod.get('name') + '/' + mod.get('name') ).init(db, router);
                        },function(err){
                            core.debug('error from finding a system module path', err);
                        });
                    }
                }
            },this);
        } else {
            sys.log('!!!no modules defined in DB');
        }
        //call our function for searching and defining modules
        findModules(docs, Module, domain);

        core.log('resolving promise in modules.init() for ' + domain);
        promise.resolve(true);
    });
        
    return promise;
};


/**
 * private functions
 */
 
function findModules(docs, Module, domain){
    
    //scan module directories
    //add them to the database but do NOT activate/init them
    core.log('In findModules');
    var dir = ['./modules', './domains/' + domain + '/modules'];
    dir.each(function(d){
        var perm = false;
        if (d == './modules') {
            perm = true;
        }
        fs.realpath(d).then(function(path){
            //filePath = path;
            sys.puts('Directory path: ' + path);
            return fs.readdir(path);
        }).then(function(files) {
            //sys.log(sys.inspect(files));
            files.each(function(file){
                dir = p.basename(file);
                core.log('for ' + domain + ' - dir: ' + dir);
                //if no items in array or this module isn't in the array
                if (docs.length == 0 || !findInDocList(docs,'name',dir)) {
                    core.log('for ' + domain + 'adding ' + dir +' to DB');
                    //add it to the DB
                    var mod = new Module();
                    mod.set('name', dir);
                    mod.activated = true;
                    mod.permanent = perm;
                    mod.save(function(err){
                        //TODO: what do we do on an error here???    
                    });
                } else {
                    sys.log('        already in DB');
                }
            });
            
        });
    });
}

function findInDocList(docs,key,value) {
    var found = false;
    docs.each(function(doc){
        if (doc.get(key) == value) {
            found = true;
        }
    });
    return found;
}        