var Collection = require('../system/collection').Collection,
    Model = require('../system/model').Model;


exports.model = new Class({
    
    Extends: Model,
    
    save: function(request){
        if (!this.updated) {
            this.updated = {};
        }
        this.updated.at = Date.now();
        if (!this.created) {
            this.created = {};
        }
        this.created.at = Date.now();
        return this.parent(request);
    }
});

exports.Collection = new Class({

    Extends: Collection,
    
    model: exports.model,
    
    name: 'settings'
});