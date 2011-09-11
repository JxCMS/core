

var Promise = require('promise').Promise,
    when = require('promise').when,
    Collection = require('../models/session.model').Collection,
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

        logger.info('in session initialize');
    },

    init: function() {
        var domain = this.request.domain,
            options = this.request.domainObj.getDbOptions(domain),
            self = this,
        opts = Object.clone(options);
        this.coll = new Collection(domain, opts);
        promise = new Promise();

        var sessionId = this.sessionId = this.request.getParam('sessionid', null);

        if (!nil(sessionId)) {
            //search for existing session
            this.coll.init().then(function(){
                return this.coll.findOne(sessionId, this.request);
            }.bind(this)).then(function(result){
                logger.info('found record for session id: ' + sessionId);
                this.data = JSON.parse(doc.data);
                this.model = doc;
                promise.resolve(true);
            }.bind(this), function(err){
                //else, save an empty data string to get an id
                logger.info('Did NOT find record for session id: ' + sessionId + ' :: Creating NEW session ID');
                s = this.coll.getModel();
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
            this.coll.init().then(function(){
                var s = this.coll.getModel();
                s.data = JSON.stringify({});
                s.save(this.request).then(function(result){
                    self.sessionId = s._id;
                    //logger.debug('response object in session.init', self.response);
                    self.response.setCookie('sessionid', self.sessionId);
                    self.model = s;
                    promise.resolve(true);
                },function(err){
                    throw err;
                });
            }.bind(this));
        }

        return promise;

    },

    'set': function(key, value) {
        this.data[key] = value;
        logger.info('added key <' + key + '> with value <' + value + '>');
        logger.debug('local data object', this.data);
    },

    'get': function(key) {
        if (!nil(this.data[key])){
            return this.data[key];
        }
    },

    save: function(){
        var s;
        //convert data to a JSON object
        if (!nil(this.model)) {
            s =  this.model;
        } else {
            s = this.coll.getModel();
        }
        s.data = JSON.stringify(this.data);
        logger.info('JSON encoded data: ' + s.data);
        //save it to the DB.
        s.save(this.request).then(function(result){
            logger.info('session data saved for session id: ' + s._id);
        },function(err){
            throw err;
        });
    }
});


var createSession = function(request, response, promises) {
    var sess = new Session(request, response);
    var promise = new Promise();
    sess.init().then(function(){
        //logger.debug('session on request', request.session);
        promise.resolve();
    });
    promises.push(promise);
}

var saveSession = function (response, promises) {
    //logger.debug('response in saveSession', response);
    if (!nil(response.session)) {
        response.session.save();
    }
}


core.addEvents({
    'beforeDispatch': createSession,
    'pageDone': saveSession,
    'sendResponse': function(request, response) {
        logger.debug('request has session in sendResponse', !nil(request.session));
        logger.debug('response has session in sendResponse', !nil(response.session));
    }
});