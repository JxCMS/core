var winston = require('winston'),
    config = require('./global-cfg').global; 

//require mootools so we can use Class everywhere
if (typeof Class == 'undefined') {
    require('mootools').apply(GLOBAL);
}

if (typeof logger == 'undefined') {
    //setup the global logging object
    GLOBAL.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: config.logger.console.level
            }),
            new (winston.transports.File)({ 
                filename: config.logger.file.file, 
                level: config.logger.file.level 
            })
        ]
    });
    logger.emitErrs = false;
}

if (typeof core == 'undefined') {
    //setup the global core object
    GLOBAL.core = new (require('../../system/core').core)(config);
}

