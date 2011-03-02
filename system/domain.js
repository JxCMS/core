/**
 * This class will be the main controlling class of the framework. It will
 * track the different domains that we can handle, the database connections
 * for each, the modules activated, and the router instance for the domain.
 */
var sys = require('sys'),
    p = require('path'),
    url = require('url'),
    fs = require('fs-promise'),
    Promise = require('promise'),
    Modules = require('modules'),
    Request = require('request').Request,
    Response = require('response').Response,
    Router = require('router').Router,
    View = require('view')
    Model = require('models');


/**
 * require the theme functions. There's no class yet and we don't actually call
 * these functions. However, we need to be sure that the system has hooked into
 * the proper events to do it's work.
 */

require('theme');

/**
 * Require session. This hooks into the proper events to enable session support.
 */
require('session');

exports.Domain = new Class({

    Implements: [Events, Options],
    options: {
    
    },
    
    domains: null,
    
    initialize: function(options){
        this.setOptions(options);
        this.domains = {}; 
    },
    
    
    init: function(){
        var promise = new Promise.Promise();
        
         //first create a list of domains. This is determined by scanning
         //the domains folder and listing all of the folders within.
         var filePath;
         var dir = './domains';
         var self = this;
         Model.loadSystemModels();
         fs.realpath(dir).then(function(path){
             dir = filePath = path;
             core.log('Directory path: ' + path);
             return fs.readdir(path);
         }).then(function(files) {
            //sys.log(sys.inspect(files));
            var promises = [];
            files.each(function(file){
                d = p.basename(file);
                core.debug('dir', dir);
                //then grab the config
                var cfg = require(dir + '/' + d +'/config/db.cfg').config;
                core.debug('config',cfg);

                //create the database connection
                self.domains[d] = {};
                //also pull in the aliases for this domain
                self.domains[d].aliases = require(dir + '/' + d +'/config/alias.cfg').alias;
                core.debug('aliases for ' + d, self.domains[d].aliases);
                //now the database
                var db = self.domains[d].db = Model.createConnection(cfg);
                //core.debug('db for ' + d, db);
                //create router
                var router = self.domains[d].router = new Router();
                core.debug('router for ' + d,router);
                //load up modules and ready all views
                promises.push(Modules.init(db, d, router));
                core.log('back from modules.init');
                View.init(d);
                core.log('back from View.init()');
            }, this);
            core.log('# of promises returned = ' + promises.length);
             
            Promise.all(promises).then(function(){
                core.log('all promises returned');
                promise.resolve(true);     
            });
         });
                
         
         return promise;
    },
    
    dispatch: function (req, resp) {
        req = new Request(req);
        resp = new Response(req, resp);
        //determine domain
        var host = req.getHeader('host');
        var domain;
        if (host.contains(':')) {
            var parts = host.split(':');
            core.debug('parts of host',parts);
            domain = parts[0];
            core.log('Domain is ' + domain);
        } else {
            domain = host;
        }
        core.debug('domain for this request',domain);
        //grab the corresponding router
        var router = null;
        //first check to see if this domain is defined
        if (this.domains[domain]) {
            router = this.domains[domain].router;
        } else {
            //otherwise check through the aliases
            Object.each(this.domains, function(d, key){
                if (d.aliases.contains(domain)) {
                    router = d.router;
                    req.aliasedDomain = key;
                    req.domainIsAlias = true;
                }
            },this);
        }

        //if we still don't have a router drop to the default
        //TODO: Should this instead case provide an error page of some kind?
        if (router === null) {
            router = this.domains['default'].router;
        }
        //add domain key to the request object (so controllers can pull
        //info from the domain object - also attached)
        req.domainObj = this;
        req.domain = domain;
        //dispatch to that router
        var promise = new Promise.Promise();
        router.dispatch(req,resp).then(function(){
            promise.resolve(resp);
        },function(err){
            //redirect to 404 error page
            resp.redirect('/error/404');
            promise.resolve(resp);
        });
        return promise;
    },

    getDb: function(domain) {
        core.log('getting database connection for domain ' + domain);
        var db;
        if (this.domains[domain]) {
            db = this.domains[domain].db;
        } else {
            Object.each(this.domains, function(d){
                if (d.aliases.contains(domain)) {
                    db = d.db;
                }
            },this);
        }
        return db;
    }
});