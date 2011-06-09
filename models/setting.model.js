var Model = require('../system/model').Model;


exports.model = new Class({
    
    Extends: Model,
    
    save: function(request){
        this.updated_at = new Date.now();
        return this.parent(request);
    }
});