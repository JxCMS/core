var sys = require("sys"),
    fs = require("fs"),
    view = require('../view');

var template='<link rel="stylesheet" type="text/css" href="/media/css/{file}.css" />';

exports.helpers = {
    
    'css': function(chunk, context) {
        core.log('in css helper function');
        core.debug('template is', template);
        core.debug('parameters passed is', context.get('css'));
        core.debug('the context in css helper', context);
        var css = context.get('css');
        Array.from(css).each(function(file){
            chunk.write(template.replace('{file}',file)).write('\n');
        });
        return chunk;
    },
    
    'cssAddFile': function(chunk, context, bodies, params) {
        core.log('in cssAddFile helper');
        //check if css key defined
        var head = context.current();
        if (nil(head.css)) {
            head.css = [];
        } else if (typeOf(head.css) != 'array') {
            head.css = Array.from(head.css);
        }
        head.css.push(params.file);
        core.debug('context after push',context.get('css'));
        return chunk;
    }
    
};