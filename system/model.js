/**
 * The model class holds a representation of the data for a single record. This
 * class may be subclassed to provide domain specific methods.
 */

//dependencies, if any, go here
var Promise = require('promise').Promise;
    
var Model = exports.Model = new Class({
   
    _original: null,
    _collection: null,
    
    initialize: function(obj, collection){
        if (nil(obj)) {
            obj = {};
        }
        
        this.setCollection(collection);
        
        //clone the object passed in so we don't change the original when
        //properties of this object are updated
        var obj2 = Object.clone(obj);
        //put the passed in object's properties onto this class instance
        Object.each(obj2, function(prop, key){
            this[key] = prop;
        },this);
        //save the original so we know what properties were added
        this._original = obj;
    },
    
    setCollection: function(collection) {
        if (!nil(collection)) {
            this._collection = collection;
        }
    },
    
    save: function(request){
        var p = new Promise(),
            res;
        core.call('preModelSave',[this,request]).then(function(){
            return this._collection.save(this.getObject());
        }.bind(this)).then(function(result){
            res = result;
            //set the id returned.
            this._id = result._id;
            return core.call('postModelSaveSuccess',[this,request]);
        }.bind(this),function(err){
            core.call('postModelSaveError',[this,request,err]);
            p.reject(err);
        }.bind(this)).then(function(){
            p.resolve(res);
        }.bind(this));
        return p;
    },
    
    remove: function(request){
        var p = new Promise();
        core.call('preModelRemove',[this,request]).then(function(){
            this._collection.remove({'_id': this._id}).then(function(result){
                p.resolve(result);
            }, function(err){
                p.reject(err);  
            });
        }.bind(this));
        return p;
    },
    
    getObject: function(){
        var obj = {},
            excludeProperties = ['caller'];
        Object.each(this, function(prop, key){
            if (typeOf(prop) !== 'function' && (!key.test(/^_\S*$/) || key == '_id') && !excludeProperties.contains(key)) {
                obj[key] = prop;
            }
        },this);
        return obj;
    }
});