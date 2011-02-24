

var sys = require('sys'),
    parser = require('parsers');


exports.Request = new Class({


    uri: null,
    method: null,
    params: null,
    request: null,

    /**
     *
     * @param req the ServerRequest object
     */
    initialize: function(req){
        this.request = req;

        //break url at ?
        var parts = req.url.split('?');
        core.debug('parts of the uri split on ?', parts);
        this.uri = parts[0];
        this.querystring = parts[1];
        this.method = req.method;
        this.params = {};

        //parse any cookies...
        this.parseCookies(req);

        //parse params from request uri and body
        var get_params = require('url').parse(this.uri, true).query;
        //combine with cookies so we can get cookie info using getParam()
        get_params = Object.merge(this.cookies, get_params);
        if (req.method == 'POST') {
            //is it multipart?
            if (req.headers.content-type.contains('multipart')){
                //this is a multipart request
                //parse it using the multipart parser
                var p = new parser.MultiPart(req);
                p.parse().then(function(params){
                    this.params = Object.merge(get_params, params);
                }.bind(this));
            } else {
                //use simple form parser
                var p = new parser.Simple(req);
            }
        } else {
            if (!nil(get_params)) {
                this.setParams(get_params);
            }
        }
        
    },

    parseCookies: function(req){
        //core.debug('request object passed to parseCookies',req);
        var cookie = this.getHeader('cookie');
        this.cookies = {};
        if (cookie) {
            try {
                var c = new parser.Cookie();
                this.cookies = c.decode(cookie);
                //delete req.headers.cookie;
            } catch (err) {
                // Ignore
            }
        }
    },

    getUri: function(){
        return this.uri;
    },

    getMethod: function(){
        return this.method;
    },

    getParam: function(key, def) {
        def = !nil(def)? def : null;
        if (!nil(this.params[key])) {
            return this.params[key];
        } else {
            return def;
        }
    },

    setParam: function(key, value) {
        this.params[key] = value;
    },

    setParams: function(obj){
        core.debug('params sent into request.setParams ', obj);
        this.params = Object.merge(this.params, obj);
        core.debug('resulting param object', this.params);
    },

    getParams: function(){
        return this.params;
    },

    getHeader: function(header, def) {
        core.debug('headers in getHeader',this.request.headers);
        if (this.request.headers[header]) {
            return this.request.headers[header];
        } else {
            return def;
        }
    },

    accepts: function(type){
        var accepts = this.getHeader('accept',null);
        var ret = false;
        if (!nil(accepts)) {
            if (accepts.contains('*/*') || accepts.contains(type)) {
                ret = true;
            }
        }

        return ret;
    }
});