var sys = require("sys"),
    fs = require("fs"),
    Template = require('node-template/lib/template').Template,
    Promise = require('promise').Promise;

var htmlTemplate='<link rel="stylesheet" type="text/css" href="/media/css/{file}.css" />';

var plugin = exports.plugin = new Class({
    
    param: null,
    
    initialize: function (params) {
        this.params = params;
        core.debug('Params passed in to css.initialize(): ',params);
    },
    
    render: function (ctx) {
        var p = new Promise(),
            css = ctx.css,
            result = '';
        
        core.info('in css helper function');
        core.debug('template is', htmlTemplate);
        core.debug('parameters passed is', css);
        Array.from(css).each(function(file){
            result += htmlTemplate.replace('{file}',file).replace(/\'/g,'');
            result += '\n';
        });
        core.debug('return from css.render(): ', result);
        p.resolve(result);
    
        return p;
    },
    
    file: function(ctx){
        var p = new Promise(),
            file = this.params[0];
        
        p.resolve(htmlTemplate.replace('{file}',file).replace(/\'/g,''));
    
        return p;
    },
    
    add: function(ctx){
        var p = new Promise(),
            arr = Array.from(ctx.css);
        
        if (arr !== null && arr !== undefined && typeOf(arr) == 'array') {
            arr.push(this.params[0]);
        } else {
            arr = [this.params[0]];
        }
        core.debug('css file list is now:',arr);
        ctx.css = arr;
        p.resolve('');
        return p;
        
    }
    
});


plugin.fn = true;
plugin.wrap = false;
plugin.$name = 'css';


Template.add(plugin);
