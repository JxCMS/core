/**
 * This module will load all models into memory automatically.
 */

var sys = require('sys'),
    p = require('path'),
    fs = require('fs-promise'),
    Promise = require('promise').Promise,
    mongoose = require('mongoose/index');

//loop through every file in the models directory and require it.

exports.createConnection = function(cfg) {
        core.log('Creating connection to db...');
        return mongoose.createConnection('mongodb://'+cfg.host + '/' + cfg.database);
};

exports.loadSystemModels = function(){
    var p = './models';

    fs.realpath(p).then(function(path){
        p = path
        return fs.readdir(path);
    }).then(function(files) {
        files.each(function(file){
            require(p + '/' + file);
        });
    });
};


