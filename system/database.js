
var sys = require('sys'),
    p = require('path'),
    fs = require('fs-promise'),
    Promise = require('promise').Promise,
    mongodb = require('mongodb');
    
var domains = {};

exports.getDatabase = function(domain, options){
    var p = new Promise();
    
    if (nil(domains[domain])) {
        logger.info('Creating database for ' + domain);
        var mongoserver, db_connector;
        domains[domain] = {};
        mongoserver = new mongodb.Server(options.host, options.port, options.server_options);
        domains[domain].server = mongoserver;
        
        logger.info('options in database',options);
        
        db_connector = new mongodb.Db(options.name, mongoserver, options.db_options);
        db_connector.open(function(err, db){
            if (err) {
                logger.info('Problem opening database');
                p.reject(err);
            } else {
                logger.info('Successfully opened database.');
                domains[domain].database = db;
                domains[domain].count = 1;
                core.call('gotDatabase' + domain.capitalize()).then(function(){
                    p.resolve(db);
                });
            }
        });
    } else {
        if (!nil(domains[domain].database)) {
            logger.info('database for ' + domain + ' already available');
            ++domains[domain].count;
            p.resolve(domains[domain].database);
        } else {
            var fn = function(){
                logger.debug('domain in gotDatabase event',domain);
                ++domains[domain].count;
                p.resolve(domains[domain].database);
            };
            logger.info('waiting for database for ' + domain);
            core.addEvent('gotDatabase' + domain.capitalize(),fn);
        }
    }
    return p;
};

exports.close = function(domain){
    if (!nil(domains[domain])){
        --domains[domain].count;
        if (domains[domain].count === 0) {
            logger.debug('closing domain',domain);
            domains[domain].database.close();
            delete domains[domain];
        } else {
            logger.info(domains[domain].count + ' references to the database for ' + domain + ' still exist');
        }
    } else {
        logger.debug('domain already closed',domain);
    }
};


exports.loadSystemModels = function(){
    var p = './models';

    fs.realpath(p).then(function(path){
        p = path;
        return fs.readdir(path);
    }).then(function(files) {
        files.each(function(file){
            require(p + '/' + file);
        });
    });
};