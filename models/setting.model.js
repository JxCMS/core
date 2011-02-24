
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var Setting = new Schema({
    key: String,
    value: String
});

var Settings = new Schema({
    module: String,
    settings: [Setting],
    updated_at: Date

});

Settings.pre('save',function(next){
    core.log('in save middleware');
    this.updated_at = Date.now();
    core.debug('model after update in save middleware',this);
    next();
});


mongoose.model('Setting', Settings);