/**
 * Base view class
 */

/**
 * Dependencies
 */
var fs = require('fs-promise'),
    fss = require('fs'),
    Promise = require('promise').Promise,
    all = require('promise').all,
    path = require('path'),
    Template = require('node-template/lib/template'),
    Response = require('./response').Response;


var templates = {};

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
        response.contentType('.html');
    },

    render: function(name){
        var promise = new Promise();

        core.debug('View object in render', this);

        core.call('preRender', [this]).then(function(){
            name = !nil(name) ? name : this.template;
            
            core.debug('returned from prerender');
            core.debug('template name', name);
    
            //check for template
            var n =  this.domain + '_' + name,
                prefixes = [this.domain, this.domain + '_' + this.data.theme],
                template = Template.Template.getTemplate(n, false);
                
            core.debug('Checking for template:',n);
            
            if (template !== null) {
                core.debug('Found the template.',template);
                //add data
                this.set('request', this.request);
                this.set('response', this.response);
                this.set('domain', this.domain);
                core.info('rendering template' + n);
                template.render(this.data,prefixes).then(function(output){
                    promise.resolve(output);
                });
            } else {
                core.debug('first template not found.. checking for alternate.');
                n = this.domain + '_' + this.data.theme + '_' + name;
                template = Template.Template.getTemplate(n, false);
                core.debug('Checking for template:',n);
                if (template !== null) {
                    core.debug('Found the template.',template);
                    //add data
                    this.set('request', this.request);
                    this.set('response', this.response);
                    this.set('domain', this.domain);
                    core.info('rendering template' + n);
                    
                    template.render(this.data,prefixes).then(function(output){
                        promise.resolve(output);
                    });
                } else {
                    core.debug('**No templates found for this action!');
                    promise.reject("No template available for this action.");
                }
            }
                
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

//The template object is a global, set it up here
//these paths are for the plugins and filters
Template.init([
    __dirname + '/../node_modules/node-template/lib/plugins',
    __dirname + '/../node_modules/node-template/lib/plugins/filters',
    __dirname + '/plugins'
]);

/**
 * load and process all view files. cycle through all domain/subdomain modules
 * and scan the view directory as well as the system modules' view
 * directory.
 */
exports.init = function(domain){
    //var promise = new Promise();

    core.debug('In View.init() for ' + domain);
    //call process_directories which also returns a promise
    //var ps = [];
    var dirs = [fss.realpathSync(__dirname + '/../../domains/' + domain + '/views'),
                fss.realpathSync(__dirname + '/../../domains/' + domain + '/modules'),
                fss.realpathSync(__dirname + '/../../modules')];

    dirs.each(function(dir){
        var basePath;
        core.debug('processing directory', dir);
        if (path.existsSync(dir)){
            core.debug("path exists: ",dir);
            basePath = dir;
            fs.readdir(dir).then(function(files){
                files.each(function(file){
                    var p, key = domain;
                    
                    core.debug('basename of path = ' + path.basename(file));
                    if (path.basename(basePath) != 'views') {
                        p = basePath + '/' + file + '/views';
                    } else {
                        p = basePath + '/' + file;
                        key += '_' + file;
                    }
                    if (path.existsSync(p)) {
                        core.debug('scanning directory:',p);
                        Template.scanDirectory(p, {}, key);
                    } else {
                        core.debug('No valid directory at: ',p);
                    }
                });
            }, function(err){
                //there are no files... ignore it and continue on
                core.debug('no files for ' + dir);
            });
        } else {
            core.debug("path does not exist:",dir);
        }
    });
    
    return true;
};

exports.createView = function(request, response, options) {
    var format = request.getParam('format', 'html').toLowerCase();
    var view = new exports[format](request, response, options);
    core.debug('returned view object', view);
    return view;
};

