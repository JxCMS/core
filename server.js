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
    when = require('promise').when;  //set up hmvc

var domain = new Domain();
domain.init().then(function(completed){
    core.log('initializing server...');
    http.createServer(function (req, res) {


        domain.dispatch(req,res).then(function(resp){
            res = resp;
            if (!res.done) {
                return core.call('sendResponse', [res]);
            } else {
                return;
            }
        }).then(function(){
            if (!res.sending) {
                return res.send();
            } else { 
                return true;
            }
        }).then(function(){
            return core.call('pageDone', res);
        });
    }).listen(8000);
    core.log('Server listening on port 8000');
});











