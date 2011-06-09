

var Promise = require('promise').Promise,
    when = require('promise').when,
    Collection = require('./collection').Collection,
    model = require('../models/session.model').model;


var Session = new Class({

    data: null,

    response: null,
    request: null,
    coll: null,
    model: null,

    initialize: function(request, response){
        response.session = this;
        request.session = this;
        this.data = {};
        this.response = response;
        this.request = request;

        core.log('in session initialize');
    },

    init: function() {
        var domain = this.request.domain,
            options = this.request.domainObj.getDbOptions(domain),
            opts = Object.clone(options);
            opts.name = 'Session';
            this.coll = new Collection(domain, model, opts);
            self = this,
            promise = new Promise();

        var sessionId = this.sessionId = this.request.getParam('sessionid', null);

        if (!nil(sessionId)) {
            //search for existing session
            coll.findOne(sessionId, this.request).then(function(result){
                core.log('found record for session id: ' + sessionId);
                this.data = JSON.parse(doc.data);
                this.model = doc;
                promise.resolve(true);
            }.bind(this), function(err){
                //else, save an empty data string to get an id
                core.log('Did NOT find record for session id: ' + sessionId + ' :: Creating NEW session ID');
                s = new model();
                s.data = JSON.stringify({});
                s.save(this.request).then(function(result){
                    //set the id as a cookie
                    self.sessionId = s._id;
                    self.response.setCookie('sessionid', this.sessionId);
                    this.model = s;
                    promise.resolve(true);
                });
            }.bind(this));
        } else {
            var s = new model();
            s.data = JSON.stringify({});
            s.save(this.request).then(function(result){
                self.sessionId = s.get('_id');
                core.debug('response object in session.init', self.response);
                self.response.setCookie('sessionid', self.sessionId);
                self.model = s;
                promise.resolve(true);
            },function(err){
                throw err;
            });
        }

        return promise;

    },

    'set': function(key, value) {
        this.data[key] = value;
        core.log('added key <' + key + '> with value <' + value + '>');
        core.debug('local data object', this.data);
    },

    'get': function(key) {
        if (!nil(this.data[key])){
            return this.data[key];
        }
    },

    save: function(){

        //convert data to a JSON object
        var s =  this.model;
        s.data = JSON.stringify(this.data);
        core.log('JSON encoded data: ' + s.data);
        //save it to the DB.
        s.save(this.request).then(function(result){
            core.log('session data saved for session id: ' + s._id);
        },function(err){
            throw err;
        });
    }
});


var createSession = function(request, response, promises) {
    var sess = new Session(request, response);
    var promise = new Promise();
    sess.init().then(function(){
        //core.debug('session on request', request.session);
        promise.resolve();
    });
    promises.push(promise);
}

var saveSession = function (response, promises) {
    //core.debug('response in saveSession', response);
    if (!nil(response.session)) {
        response.session.save();
    }
}


core.addEvents({
    'beforeDispatch': createSession,
    'pageDone': saveSession,
    'sendResponse': function(request, response) {
        core.debug('request has session in sendResponse', !nil(request.session));
        core.debug('response has session in sendResponse', !nil(response.session));
    }
});