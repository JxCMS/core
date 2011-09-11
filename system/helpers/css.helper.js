var sys = require("sys"),
    fs = require("fs"),
    view = require('../view');

var template='<link rel="stylesheet" type="text/css" href="/media/css/{file}.css" />';

exports.helpers = {
    
    'css': function(chunk, context) {
        logger.info('in css helper function');
        logger.debug('template is', template);
        logger.debug('parameters passed is', context.get('css'));
        logger.debug('the context in css helper', context);
        var css = context.get('css');
        Array.from(css).each(function(file){
            chunk.write(template.replace('{file}',file)).write('\n');
        });
        return chunk;
    },
    
    'cssFile': function(chunk, context, bodies, params) {
        logger.info('in cssAddFile helper');
        //check if css key defined
        return chunk.write(template.replace('{file}',params.file)).write('\n');
    }
    
};