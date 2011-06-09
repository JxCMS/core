
var Collection = require('./collection').Collection,
    model = require('../models/setting.model').model,
    Promise = require('promise').Promise;


var Settings = new Class({

    find: function(key, request, def, add) {

        add = !nil(add) ? add : false;

        var domain = request.domain,
            db = request.domainObj.getDbOptions(domain),
            parts = key.split('.'),
            opts = Object.clone(options),
            promise = new Promise(),
            ret = null;
            opts.name = "settings";            
            var coll = new Collection(domain, model, opts),
                select = coll.select();
            
            
    

        core.debug('parts of key', parts);
        //find the setting we need
        select.query = {'module': parts[0] , settings: {"$elemMatch": { key: parts[1]}}};
        coll.find(select, request).then(function(results){
            //core.debug('doc found in setting.find', docs);
            docs.each(function(d){
                d.settings.each(function(doc){
                    if (doc.key == parts[1]) {
                        ret = doc.value;
                    }
                });
            });
            if (nil(ret) && def) {
                ret = def;
            }
            promise.resolve(ret);
        }.bind(this),function(err){
            core.debug('error in setting.find', err.message);
            if (add) {
                this.add(key, def, request);
            }
            promise.resolve(def);
        }.bind(this));
        return promise;
    },

    add: function(key, value, request) {
        var domain = request.domain;
        var db = request.domainObj.getDb(domain);

        var parts = key.split('.');

        var Setting = db.model('Setting');

        //save this but delete it after the first run
        var s = new model();
        s.module = parts[0];
        s.settings = [];
        s.settings.push({key: parts[1], value: value});
        core.debug('setting we\'re adding before saving',s);
        var promise = new Promise();
        s.save(request).then(function(result){
            core.log('save successful');
            promise.resolve(true);
        }.bind(this),function(err){
            core.debug('error on save', err);
            promise.reject('Could not save: ' + err.message);
        }.bind(this));
        return promise;
    }
});

exports.Settings = Settings;