var router = require('./router').Router,
    sys = require('sys'),
    fs = require('fs-promise'),
    p = require('path'),
    Path = require('path'),
    Collection = require('../models/modules.model').Collection,
    model = require('../models/modules.model').model,
    Promise = require('promise').Promise;

//load model
require('../models/modules.model');

var modules = {},
    coll;

exports.init = function(domain, router, options){
    var promise = new Promise();
    
    logger.info('In Modules.init() for ' + domain);
    modules[domain] = {};
    var opts = Object.clone(options);
    logger.debug('options in module.init() = ',opts);
    coll = new Collection(domain, opts);
    var select = coll.getSelect();
        
    coll.init().then(function(){
        return coll.find(select, {});
    }.bind(this)).then(function(results){
        if (results.length > 0) {
            logger.debug('results returned: ', results);
            results.each(function(mod){
                if (mod.activated) {
                    if (mod.permanent) {
                        //this is a system module
                        logger.info('get system modules for ' + domain);
                        fs.realpath('./modules/').then(function(path){
                            var m = path + '/' + mod.name + '/' + mod.name;
                            if (Path.existsSync(m + '.js')) {
                                modules[domain][mod.name] = require(m);
                                return modules[domain][mod.name].init(router, domain, opts);
                            } else {
                                logger.info('path ' + m + '.js does not exist');
                                return true;
                            }
                        },function(err){
                            logger.debug('error from finding a system module path', err);
                        }).then(function(){
                            core.fireEvent('moduleInitDone', [mod.name]);
                        });
                    } else {
                        logger.info('get domain specific modules for ' + domain);
                        //this is a domain specific module
                        fs.realpath('./domains/' + domain + '/modules/').then(function(path){
                            var m = path + '/' + mod.name + '/' + mod.name;
                            if (Path.existsSync(m + '.js')) {
                                modules[domain][mod.name] = require(m);
                                return modules[domain][mod.name].init(router, domain, options);
                            } else {
                                logger.info('path ' + m + '.js does not exist');
                                return true;
                            }
                        },function(err){
                            logger.debug('error from finding a system module path', err);
                        }).then(function(){
                            core.fireEvent('moduleInitDone', [mod.name]);
                        });
                    }
                }
            },this);
        } else {
            sys.log('!!!no modules defined in DB');
        }
        //call our function for searching and defining modules
        findModules(results, domain);

        logger.info('resolving promise in modules.init() for ' + domain);
        promise.resolve(true);
    });
        
    return promise;
};

exports.isModuleReady = function (module, domain, returnModule) {
    returnModule = !nil(returnModule) ? returnModule : false;
    if (returnModule) {
        if (!nil(modules[domain][module])) {
            return modules[domain][module];
        } else {
            return false;
        }
    } else {
        return !nil(modules[domain][module]);
    }
};


/**
 * private functions
 */
 
function findModules(results, domain){
    
    //scan module directories
    //add them to the database but do NOT activate/init them
    logger.info('In findModules');
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
        }, function(err){
            //no such directory...
            throw err;
        }).then(function(files) {
            //sys.log(sys.inspect(files));
            files.each(function(file){
                dir = p.basename(file);
                logger.info('for ' + domain + ' - dir: ' + dir);
                //if no items in array or this module isn't in the array
                if (results.length === 0 || !findInDocList(results,'name',dir)) {
                    logger.info('for ' + domain + 'adding ' + dir +' to DB');
                    //add it to the DB
                    var mod = coll.getModel();
                    mod.name = dir;
                    mod.activated = true;
                    mod.permanent = perm;
                    mod.save({});
                } else {
                    sys.log('        already in DB');
                }
            });
            
        },function(err){
            //no files... continue on
        });
    });
}

function findInDocList(results,key,value) {
    var found = false;
    results.each(function(res){
        if (res[key] == value) {
            found = true;
        }
    });
    return found;
}        