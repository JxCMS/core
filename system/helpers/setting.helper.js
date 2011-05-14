var sys = require("sys"),
    fs = require("fs"),
    Settings = require('../settings').Settings;


/**
 * this will be similar to the Domain.redirect() method however it doesn't
 * send anything to the client but will instead return the string representation
 * of the results of calling the url passed in
 */
exports.helpers = {
    'setting' : function(chunk, context, bodies, params) {
        //this may be async so call with chunk.map
        return chunk.map(function(chunk){
            var s = new Settings();
            s.find(params.key, context.get('request'), '', false).then(function(value){
                chunk.end(value);
            });
        });
    }
};