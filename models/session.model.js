var mongoose = require('mongoose')
    , Schema = mongoose.Schema;


var session = new Schema({
    data: {type: String, 'default': {} }, //json encoded string
    updated_at: Date

});

session.pre('save',function(next){
    this.updated_at = Date.now();
    next();
});


mongoose.model('Session', session);