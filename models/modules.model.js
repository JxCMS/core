
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var module = new Schema({
    name: {type: String, index: true, required: true},
    activated: Boolean,
    permanent: Boolean,
    updated_at: Date
    
});

module.pre('save',function(next){
    this.updated_at = new Date().getTime();
    next();
});

module.method('setActive', function(active){
            this.activated = active;
});

       

mongoose.model('Module', module);