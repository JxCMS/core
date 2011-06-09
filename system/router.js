var sys = require('sys'),
    Promise = require('promise').Promise,
    request = require('./request').Request,
    response = require('./response').Response;

(function(){

var Route = new Class({

    method: null,
    re: null,
    controllerLocation: null,
    name: null,

    methods: ['GET','POST','PUT','DELETE'],

    initialize: function(name, method, re, keys, controller, defs) {
        sys.log('in Route initialize...\n');
        if (this.methods.contains(method) || method == '*') {
            this.method = method;
        } else {
            this.method = '*';
        }

        this.keys = keys;
        this.name = name;
        this.re = re;
        this.controller = controller;
        this.defs = defs;
    },

    match: function(uri) {
        //test if we have a matching uri.
        sys.log('uri:'+sys.inspect(uri));
        sys.log('re: '+sys.inspect(this.re));
        if (this.re.test(uri)) {
            //get the captures
            var parts = uri.match(this.re);
            sys.log('parts before pops: ' + sys.inspect(parts));
            //kill first part
            parts.shift();
            //and pop off the last two...
            delete parts.index;
            delete parts.input;
            sys.log('parts after pops: ' + sys.inspect(parts));
            //now, take the keys and the parts and match them up...
            params = {};
            if (this.keys !== null) {
                for (i = 0; i < this.keys.length;i++){
                    params[this.keys[i]] = parts.shift();
                }
            }
            
            Object.each(this.defs, function(val,key){
                if (nil(params[key])) {
                    params[key] = val;
                }
            }, this);
            
            //take anything left over and pass it back in the "extra" key
            params.extra = parts;
            return {
                controller: this.controller,
                params: params
            };
        }
        return false;

    }

});


var Router = exports.Router = new Class({

    routes: null,

    initialize: function(){
        this.routes = [];
    },

    /**
     *
     * @param urls an array of arrays in which the inner arrays are of the form
     *          ["route_name","route_regex",callback]
     */
    add: function(urls) {

        var url_re = /^(\w+|\*)(\s(.*))?$/;
        urls.each(function(url){
            var parts = url[1].match(url_re);
            sys.log('parts: '+sys.inspect(parts));
            if (nil(parts)) {
                sys.log('returning false');
                return false;
            }
            sys.log('adding route...');
            this.routes.push(new Route(url[0],parts[1],new RegExp('^'+(parts[3] || '')),url[2], url[3], url[4]));
            core.fireEvent('routeAdded');
        },this);


        return true;
    },

    get: function(name) {
        var r;
        this.routes.each(function(route){
            if (route.name == name) {
                r = route;
            }
        },this);
        return r;

    },

    all: function() {
        return this.routes;
    },

    remove: function(name) {
        var route = Router.get(name);
        Router.routes.erase(route);
    },

    dispatch: function(req, resp) {

        var promise = new Promise();
        
        var ret = false;
        this.routes.each(function(route){
            r = route.match(req.getUri());
            core.debug('return from route match', r);
            if (r !== false) {
                ret = r;
            }
        },this);
        if (ret !== false) {
            var controller = ret.controller;
            //core.debug('request in router dispatch',req);
            req.setParams(ret.params);
            core.call('beforeDispatch',[req,resp]).then(function(){
                return controller.dispatch(req,resp);
            }).then(function(){
                return core.call('afterDispatch',[req,resp]);
            }).then(function(){
                promise.resolve(true);
            });
        } else {
            promise.reject('no route available.');
        }
        return promise;
    }

});


})();