/**
 * This is the main file for the cms. Run it by typing
 *
 * node server.js
 *
 * at a command line.
 *
 * 
 */
//require mootools so we can use Class everywhere
require('mootools').apply(GLOBAL);


var config = require('./config/global').global,  //global config
    winston = require('winston'),
    server;
    
//setup the global core object
GLOBAL.core = new (require('./system/core').core)(config);

process.on('uncaughtException',function(err){
   //prevent the server from receiving new requests.
   server.close();
   //log the exception
   core.debug('Uncaught Exception:\n',err.message);
   core.debug('arguments:',err.arguments);
   core.debug('stack trace:' + err.stack);
   //give winston time to flush the logs.
   setTimeout(function(){ process.exit(1);},1000);
});

//setup the global logging object
GLOBAL.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: config.logger.console.level,
        }),
        new (winston.transports.File)({ 
            filename: config.logger.file.file, 
            level: config.logger.file.level,
            json: false
        })
    ]
});
logger.emitErrs = false;



var sys = require('sys'),
    Domain = require('./system/domain').Domain,
    http = require('http'),
    when = require('promise').when;  //set up hmvc

var domain = new Domain();
domain.init().then(function(completed){
    core.info('initializing server...');
    server = http.createServer(function (req, res) {
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
    });
    server.listen(8000);
    core.info('Server listening on port 8000');
});











