var sys = require("sys"),
    fs = require("fs"),
    Template = require('node-template/lib/template').Template,
    Promise = require('promise').Promise;

var htmlTemplate='<script type="text/javascript" src="/media/js/{file}.js" ></script>';

var plugin = exports.plugin = new Class({
    
    param: null,
    
    initialize: function (params) {
        this.params = params;
        core.debug('Params passed in to js.initialize(): ',params);
    },
    
    render: function (ctx) {
        var p = new Promise(),
            js = ctx.js,
            result = '';
        
        core.info('in js helper function');
        core.debug('template is', htmlTemplate);
        core.debug('parameters passed is', this.params);
        Array.from(js).each(function(file){
            result += htmlTemplate.replace('{file}',file).replace(/\'/g,'');
            result += '\n';
        });
        core.debug('return from js.render(): ', result);
        p.resolve(result);
    
        return p;
    },
    
    file: function(ctx){
        var p = new Promise(),
            file = this.params[0];
        
        result = htmlTemplate.replace('{file}',file).replace(/\'/g,'');
        core.debug('return from js.file(): ', result);
        p.resolve(result);
    
        return p;
    },
    
    add: function(ctx){
        var p = new Promise(),
            arr = Array.from(ctx.js);
        
        arr.push(this.params[0]);
        p.resolve('');
        return p;
        
    }
    
});


plugin.fn = true;
plugin.wrap = false;
plugin.$name = 'js';


Template.add(plugin);
