
var Promise = require('promise').Promise;


var Settings = new Class({

    find: function(key, request, def, add) {

        add = !nil(add) ? add : false;

        var domain = request.domain,
            db = request.domainObj.getDb(domain),
            parts = key.split('.'),
            Setting = db.model('Setting'),
            promise = new Promise(),
            ret = null;

        core.debug('parts of key', parts);
        //find the setting we need
        Setting.find({'module': parts[0] , settings: {"$elemMatch": { key: parts[1]}}}, function(err, docs){

            if (err) {
                core.debug('error in setting.find', err.message);
                if (add) {
                    Settings.add(key, def, request);
                }
                ret = def;
            } else {
                core.debug('doc found in setting.find', docs);
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
            }
            promise.resolve(ret);
        });
        return promise;
    },

    add: function(key, value, request) {
        var domain = request.domain;
        var db = request.domainObj.getDb(domain);

        var parts = key.split('.');

        var Setting = db.model('Setting');

        //save this but delete it after the first run
        var s = new Setting();
        s.module = parts[0];
        s.settings = [];
        s.settings.push({key: parts[1], value: value});
        core.debug('setting we\'re adding before saving',s);
        var promise = new Promise();
        s.save(function(err, doc){
            //no need to handle error.
            if (err) {
                core.debug('error on save', err);
                promise.reject('Could not save: ' + err.message);
            } else {
                core.log('save successful');
                promise.resolve(true);
            }

        });
        return promise;
    }
});

exports.Settings = Settings;