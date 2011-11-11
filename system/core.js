/**
 * Core of the new system.
 *
 * Will use this as a way of creating an event system...
 */

var Promise = require('promise').Promise,
    all = require('promise').all,
    when = require('promise').when,
    util = require('util');


var core = new Class({

    Implements: [Events, Options],

    version: '0.1.1dev',

    options: {
        mode: 'development'
    },

    init: false,

    initialize: function(options){
        this.setOptions(options);

    },

    getOption: function(key){
        if (!nil(this.options[key])) {
            return this.options[key];
        } else {
            return null;
        }
    },
    
    debug: function(label, obj) {
        logger.debug(label + " " + util.inspect(obj,false,null));
        //sys.puts(' :: called from ' + arguments.callee.caller.name);
    },
    
    info: function(str,obj) {
        if (obj !== null && obj !== undefined) {
            logger.info(str + " " + util.inspect(obj,false,null));
        } else {
            logger.info(str);
        }

    },

    call: function(eventName, args){
        var promises = [];
        var args = Array.from(args);
        args.push(promises);
        this.fireEvent(eventName, args);
        var promise = new Promise();
        if (promises.length > 0) {
            this.info('promises were returned from function call ' + eventName + '... wait for them');
            var self = this;
            all(promises).then(function(result){
                self.info('resolving promises in core.call for ' + eventName);
                promise.resolve(result);
            });
        } else {
            this.info('no promises returned from function call ' + eventName);
            promise.resolve(true);
        }
        return promise;

    }
});


exports.core = core;