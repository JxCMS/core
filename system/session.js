

var Promise = require('promise').Promise,
    when = require('promise').when;


var Session = new Class({

    data: null,

    response: null,
    request: null,
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
        //get DB from domainObj
        var domain = this.request.domain,
            db = this.request.domainObj.getDb(domain),
            sess = db.model('Session'),
            self = this,
            promise = new Promise();

        var sessionId = this.sessionId = this.request.getParam('sessionid', null);

        if (!nil(sessionId)) {
            //search for existing session
            sess.findById(sessionId,function(err, doc){
                //if exists convert data from JSON to object
                if (!err) {
                    core.log('found record for session id: ' + sessionId);
                    this.data = JSON.parse(doc.data);
                    this.model = doc;
                    //is this session expired?
                    promise.resolve(true);
                } else {
                    //else, save an empty data string to get an id
                    core.log('Did NOT find record for session id: ' + sessionId + ' :: Creating NEW session ID');
                    s = new sess();
                    s.data = JSON.stringify({});
                    s.save(function(err){
                        //set the id as a cookie
                        self.sessionId = s.get('_id');
                        self.response.setCookie('sessionid', this.sessionId);
                        self.model = s;
                        promise.resolve(true);
                    });
                }

            }.bind(this));
        } else {
            var s = new sess();
            s.data = JSON.stringify({});
            s.save(function(err){
                if (err) {
                    throw err;
                } else {
                    self.sessionId = s.get('_id');
                    core.debug('response object in session.init', self.response);
                    self.response.setCookie('sessionid', self.sessionId);
                    self.model = s;
                    promise.resolve(true);
                }
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
        s.save(function(err){
            if (err) {
                throw err;
            } else {
                core.log('session data saved for session id: ' + s.get('_id'));
            }
        });
    }
});


var createSession = function(request, response, promises) {
    var sess = new Session(request, response);
    var promise = new Promise();
    when(sess.init(), function(){
        core.debug('session on request', request.session);
        promise.resolve();
    });
    promises.push(promise);
}

var saveSession = function (response, promises) {
    core.debug('response in saveSession', response);
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