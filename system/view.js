/**
 * Base view class
 */

/**
 * Dependencies
 */
var fs = require('fs-promise'),
    Promise = require('promise').Promise,
    all = require('promise').all,
    path = require('path'),
    jazz = require('jazz/lib/jazz'),
    dust = require('dust'),
    Response = require('./response').Response;


var templates = {};

var helpers = {};

var dustBase;

exports.json = new Class({

    data: null,

    initialize: function(request, response, options){
        this.data = {};
        response.contentType('.json');
    },

    render: function(){
        return JSON.stringify(this.data);
    },

    'set': function(key, value){
        this.data[key] = value;
    }
});

exports.file = new Class({

    filePath: null,
    content: null,
    useContent: false,
    type: null,

    initialize: function(request, response, options){
        this.data = {};
        this.response = response;
    },

    setStringType: function(flag) {
        this.useContent = flag;
        return this;
    },

    render: function(){
        var promise = new Promise();
        if (this.useContent) {
            this.response.contentType(this.type);
            promise.resolve(this.content);
        } else {
            if (!nil(this.filePath)) {
                this.response.sendfile(this.filePath).then(function(){
                    promise.resolve(null);    
                });
            } else {
                //send back a 404 error
                this.response.setStatus(Response.Codes.notFound);
                promise.resolve('No file path supplied to view.');
            }
        }
        return promise;
    },


    'set': function(key, value){
        if (key == 'content') {
            this.content = value;
            this.useContent = true;
        } else {
            //this should be a full path to the file
            this.filePath = value;
        }
        return this;
    },

    setFileType: function (type) {
        this.type = type;
    }
});

exports.html = new Class({

    Implements: [Options],

    data: null,
    domain: null,
    template: null,
    request: null,
    response: null,

    options: {},

    initialize: function(request, response, options){
        this.setOptions(options);
        this.request = request;
        this.response = response;
        if (request.domainIsAlias) {
            this.domain = request.aliasedDomain;
        } else {
            this.domain = request.domain;
        }
        this.setTemplate(request.getParam('action'));
        this.data = {};
        //grab the helpers for the current domain and
        //add them to the view
        Object.each(helpers[this.domain], function (item, key){
            this[key] = item;
        },this);
        response.contentType('.html');
    },

    render: function(name){
        var promise = new Promise();

        core.debug('View object in render', this);

        core.call('preRender', [this]).then(function(){
            name = !nil(name) ? name : this.template;
            
            core.log('returned from prerender');
            core.debug('template name', name);
    
            //check for template
            var n = this.domain + '_' + name,
                template,
                keys = Object.keys(dust.cache);
            if (keys.contains(n)) {
                template = n;
            } else {
                n = this.domain + '_' + this.data.theme + '_' + name;
                if (keys.contains(n)) {
                    template = n;
                }
            }
            
            core.debug('template chosen', template);
            //grab the dust global context and push in our data
            
            //add data
            this.set('request', this.request);
            this.set('response', this.response);
            this.set('domain', this.domain);
            
            //grab system helpers
            var context = dustBase.push(helpers.system);
            //then grab the domain specific helpers
            context = context.push(helpers[this.domain]);
            dust.render(template, context.push(this.data), function(err, out){
                core.debug('content returned by dust', out);
                promise.resolve(out);
            });
        }.bind(this));

        return promise;
    },

    'set': function(key, value){
        this.data[key] = value;
    },

    setTemplate: function(template){
        this.template = template;
    }

});

/**
 * load and process all view files. cycle through all domain/subdomain modules
 * and scan the view directory as well as the system modules' view
 * directory.
 */
exports.init = function(domain){
    //var promise = new Promise();

    core.log('In View.init() for ' + domain);
    //call process_directories which also returns a promise
    //var ps = [];
    var dirs = ['domains/' + domain + '/views', 'domains/' + domain + '/modules','./modules'];
    templates[domain] = {};
    helpers[domain] = {};

    dirs.each(function(dir){
        var basePath;
        fs.realpath(dir).then(function(path){
            basePath = path;
            return fs.readdir(path);
        }, function(err){
            //no directory here...continue on
            throw err;
        }).then(function(files){
            files.each(function(file){
                var p;
                core.log('basename of path = ' + path.basename(file));
                if (path.basename(basePath) != 'views') {
                    p = basePath + '/' + file + '/views';
                } else {
                    p = basePath + '/' + file;
                }
                process_directory(p, domain);
            });
        }, function(err){
            //there are no files... ignore it and continue on
            core.log('no files for ' + dir);
        });
    });
    
    //create the dust global context
    dustBase = dust.makeBase({});
    core.debug('the dustBase object', dustBase);
    //load system helpers (available in all contexts)
    //modules are responsible for loading their own helpers which 
    //would be domain specific.
    load_helpers();
    return true;
};

/**
 * Load all of the helpers in the helpers sub folder
 */
var load_helpers = function () {
    fs.readdir(__dirname + '/helpers').then(function(files){
        if (files.length > 0) {
            files.each(function(file){
                if (file.contains('.helper')) {
                    var helpers = require(__dirname + '/helpers/' + file).helpers; 
                    Object.each(helpers, function(fn, key){
                        exports.registerHelper(key, fn, 'system');  
                    });
                }
            });
        }
    });
};

var process_directory = function(dir, domain){
    core.log('in process directory for dir ' + dir + ' and domain ' + domain);
    //load all files in the given directory
    fs.readdir(dir).then(function(files){
        core.debug('files for ' + dir + ' and domain ' + domain, files);
        if (files.length > 0) {
            core.log('loading files for ' + dir + 'and domain ' + domain);
            files.each(function(file){
                if (file.contains('.dust')) {
                    fs.readFile(dir+'/'+file, 'utf-8').then(function(text){
                        var name =  path.basename(file, path.extname(file));
                        if (path.basename(dir) !== 'views') {
                            core.log('dir: ' + dir);
                            core.log('basename: ' + path.basename(dir));
                            name = path.basename(dir) + '_' + name;
                        }
                        name = domain + '_' + name
                        if (!Object.keys(dust.cache).contains(name)) {
                            core.debug('text in file ' + name, text);
                            //templates[domain][name] = jazz.compile(text);
                            dust.loadSource(dust.compile(text, name));
                        }
                    }, function(err){
                        core.debug('got an error', err);
                        throw err;
                    });
                }
            });
        }
        core.log('done processing ' + dir + ' on ' + domain);

    }, function(err){
        core.debug('got an error', err);
        core.log('error was in process_directory for ' + dir + ' on ' + domain);
        if (err.errno != 2) {
            core.debug('err',err);
            throw err;

        } else {
            //missing file or directory...
            // continue through...
        }
    });
};

/**
 * helpers can be single functions or objects. ControllerHelpers are really a 
 * misnomer but I couldn't think of anything better to call them. These allow 
 * you to pass information to a template by calling methods on the view.
 */
exports.registerHelper = function(name, fn, domain) {
    core.log('registering ' + name + ' in the ' + domain + ' domain.');
    if (nil(helpers[domain])) {
        helpers[domain] = {};
    }
    helpers[domain][name] = fn;
};

exports.createView = function(request, response, options) {
    var format = request.getParam('format', 'html').toLowerCase();
    var view = new exports[format](request, response, options);
    core.debug('returned view object', view);
    return view;
};

/**
 * Override the dust.onLoad in order to look up missing files when used
 * in partials and such (though since we precompile there should be no missing
 * files
 */

