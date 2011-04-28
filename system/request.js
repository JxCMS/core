

var sys = require('sys'),
    parser = require('./parsers'),
    url = require('url');


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

        var params,
            urlObj = url.parse(req.url,true);
            
        this.uri = urlObj.pathname;
        core.debug('urlObj', urlObj);
        if (!nil(urlObj.search)) {
            //pull the ? if it's there
            if (urlObj.search.contains('?')) {
                var parts = urlObj.search.split('?');
                core.debug('querystring', parts[1]);
                urlObj.search = parts[1];
            }
            params = urlObj.search.parseQueryString();
        } else {
            params = {};
        }
        core.debug('params from url', params);
        //parse any cookies...
        this.parseCookies(req);

        //parse params from request uri and body
        //var get_params = require('url').parse(this.uri, true).query;
        //core.debug('url params passed in', get_params);
        //combine with cookies so we can get cookie info using getParam()
        var get_params = Object.merge(this.cookies, params);
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
        var ret;
        if (!nil(this.params[key])) {
            ret = this.params[key];
        } else {
            ret = def;
        }
        core.debug('getParam(' + key + ')',ret);
        return ret;
    },

    setParam: function(key, value) {
        this.params[key] = value;
    },

    setParams: function(obj){
        core.debug('params sent into request.setParams ', obj);
        if (nil(this.params)) {
            this.params = {};
        }
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
    },

    isAjax: function(){
        //for now return false...
        return false;
        //TODO: figure out how to tell if this came via ajax
    }
});