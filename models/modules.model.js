
var Collection = require('../system/collection').Collection,
    Model = require('../system/model').Model;


exports.model = new Class({
    
    Extends: Model,
    
    save: function(request){
        this.updated_at = new Date().getTime();
        return this.parent(request);
    },
    
    setActive: function(active) {
        this.activated = active;
    }
});


exports.Collection = new Class({

    Extends: Collection,
    
    model: exports.model,
    
    name: 'modules'
});