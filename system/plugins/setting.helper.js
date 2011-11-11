var sys = require("sys"),
    fs = require("fs"),
    Settings = require('../settings').Settings,
    Template = require('node-template/lib/template').Template,
    Promise = require('promise').Promise;


var plugin = exports.plugin = new Class({
    
    param: null,
    
    initialize: function (params) {
        this.params = params;
    },
    
    render: function (ctx) {
        var p = new Promise(),
            s = new Settings(),
            key = this.params[0].replace(/\'/g,''),
            def = this.params[1];
            
        if (def !== undefined && def !== null) {
            def = def.replace(/\'/g,'');
            s.find(key, ctx.request, def, true).then(function(value){
                p.resolve(value);
            });
        } else {
            s.find(key, ctx.request, '', false).then(function(value){
                p.resolve(value);
            });
        }
        
        
            
        return p;
    }
    
});


plugin.fn = true;
plugin.wrap = false;
plugin.$name = 'setting';


Template.add(plugin);

