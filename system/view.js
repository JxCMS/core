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
    jazz = require('jazz/lib/jazz');


var templates = {};

var helpers = {};

exports.JSON = new Class({

    data: null,

    initialize: function(){
        this.data = {};
    },

    render: function(){
        return JSON.stringify(this.data);
    },

    'set': function(key, value){
        this.data[key] = value;
    }
});

exports.html = new Class({

    Implements: [Options],

    data: null,
    domain: null,
    template: null,

    options: {},

    initialize: function(request, response, options){
        this.setOptions(options);
        if (request.domainIsAlias) {
            this.domain = request.aliasedDomain;
        } else {
            this.domain = request.domain;
        }
        this.data = {};
        //automatically add the partial support
        this.data.partial = this.render.bind(this);
    },

    render: function(name){
        var promise = new Promise();

        core.debug('View object in render', this);

        name = !nil(name) ? name : this.template;

        if (!nil(templates[this.domain][name])) {
            //merge in the helpers
            var data = Object.merge(helpers[this.domain],this.data);
            core.debug('data passed to jazz template', data);
            templates[this.domain][name].eval(data, function(data){
                core.debug('content returned by jazz', data);
                promise.resolve(data);
            });
        }

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
    return true;
};

var process_directory = function(dir, domain){
    core.log('in process directory for dir ' + dir + ' and domain ' + domain);
    //load all files in the given directory
    fs.readdir(dir).then(function(files){
        core.debug('files for ' + dir + ' and domain ' + domain, files);
        if (files.length > 0) {
            core.log('loading files for ' + dir + 'and domain ' + domain);
            files.each(function(file){
                if (file.contains('.jazz')) {
                    fs.readFile(dir+'/'+file, 'utf-8').then(function(text){
                        var name = path.basename(file, path.extname(file));
                        if (path.basename(dir) !== 'views') {
                            core.log('dir: ' + dir);
                            core.log('basename: ' + path.basename(dir));
                            name = path.basename(dir) + '/' + name;
                        }
                        if (!Object.keys(templates[domain]).contains(name)) {
                            core.debug('text in file ' + file, text);
                            templates[domain][name] = jazz.compile(text);
                            core.debug('current templates for domain ' + domain, templates[domain]);
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

exports.registerHelper = function(name, fn, domain) {
    helpers[domain][name] = fn;
};

exports.createView = function(request, response, options) {
    var format = request.getParam('format', 'html').toLowerCase();
    var view = new exports[format](request, response, options);
    core.debug('returned view object', view);
    return view;
}
