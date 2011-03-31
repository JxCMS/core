/**
 * This is the main file for the cms. Run it by typing
 *
 * node cms.js
 *
 * at a command line.
 *
 * 
 */

//add current system paths to require
//DEPRECATED function - leave it here though until we can test everything without it
//require.paths.unshift('./vendor', './system', './config', './models','./modules');

//require mootools so we can use Class everywhere
require('mootools').apply(GLOBAL);

var config = require('./config/global').global;  //global config

//setup the global core object
GLOBAL.core = new (require('./system/core').core)(config);

var sys = require('sys'),
    Domain = require('./system/domain').Domain,
    http = require('http'),
    when = require('promise').when;

//hook into events to observe what's happening
core.addEvents({
    beforeDispatch: function(req,resp){ core.log('in beforeDispatch event');},
    afterDispatch: function(req,resp){ core.log('in afterDispatch event');},
    beforeAction: function(req,resp){ core.log('in beforeAction event');},
    afterAction: function(req,resp){ core.log('in afterAction event');}
});

var domain = new Domain();
domain.init().then(function(completed){
    core.log('initializing server...');
    http.createServer(function (req, res) {


        domain.dispatch(req,res).then(function(resp){
            res = resp;
           return core.call('sendResponse', [res]);
        }).then(function(){
            return res.send();
        }).then(function(){
            return core.call('pageDone', res);
        });
    }).listen(8000);
});











