//require mootools so we can use Class everywhere
if (typeof Class == 'undefined') {
    require('mootools').apply(GLOBAL);
}

if (typeof core == 'undefined') {
    var config = require('./global-cfg').global;  //test global config

    //setup the global core object
    GLOBAL.core = new (require('../../system/core').core)(config);
}