/**
 * Response Class
 * inspired and copied in part from express' Response class
 */

var fs = require('fs-promise')
  , Promise = require('promise').Promise
  , ofs = require('fs')  //original fs library
  , http = require('http')
  , path = require('path')
  , pump = require('util').pump
  , utils = require('./utils')
  , parsers = require('./parsers')
  , parseRange = utils.parseRange
  , mime = utils.mime;


var Response = exports.Response = new Class({

    resp: null,
    req: null,

    multiple: ['Set-Cookie'],

    headers: null,
    content: null,
    status: null,
    cookie: null,
    done: false,

    initialize: function(req, resp){
        if (!nil(resp)) {
            this.resp = resp;
        }
        
        this.req = req;
        this.headers = {};
        this.content = '';
        this.cookie = new parsers.Cookie();
    },


    send: function(){

        if (this.done || nil(this.resp)) return;
        
        // Defaults
        var status = this.status || 200,
            content = this.content;

        // Populate Content-Length
        if (!this.headers['Content-Length'] && 204 != status) {
            this.header('Content-Length', content instanceof Buffer
                ? content.length
                : Buffer.byteLength(content));
        }

        // Strip irrelevant headers
        if (204 === status) {
            delete this.headers['Content-Type'];
            delete this.headers['Content-Length'];
        }

        // Respond
        this.resp.writeHead(status, this.headers);
        this.resp.end('HEAD' == this.req.getMethod() ? undefined : content);
    },

    /**
     * Transfer the file at the given `path`. Automatically sets
     * the _Content-Type_ response header via `res.contentType()`.
     *
     * Accepts an optional callback `fn(err, path)`.
     *
     * @param {String} path
     * @param {Function} fn
     * @api public
     */

    sendfile: function(path){
        var self = this,
            ranges = self.req.getHeader('range'),
            head = 'HEAD' == self.req.getMethod(),
            promise = new Promise();
            
        if (nil(this.resp)) {
            promise.resolve(false);
            return promise;
        }
        
        if (~path.indexOf('..')){
            this.setStatus(403);
            promise.resolve(true);
        } else {
            fs.stat(path).then(function(stat){
                var status = 200,
                    stream = null;
    
                core.debug('stat object back', stat);
                
                // We have a Range request
                if (ranges) {
                    ranges = parseRange(stat.size, ranges);
                    // Valid
                    if (ranges) {
                        stream = ofs.createReadStream(path, ranges[0]);
                        var start = ranges[0].start,
                            end = ranges[0].end;
                        status = 206;
                              self.header('Content-Range', 'bytes '
                            + start
                            + '-'
                            + end
                            + '/'
                            + stat.size);
                        // Invalid
                    } else {
                        return self.send(416);
                    }
                    // Stream the entire file
                } else {
                    core.debug('path to stream from', path);
                    stream = ofs.createReadStream(path);
                    core.debug('stream object created', stream);
                    self.header('Content-Length', stat.size);
                }
    
                // Transfer
                self.contentType(path);
                self.header('Accept-Ranges', 'bytes');
                self.resp.writeHead(status, self.headers);
                if (head) return self.end();
                pump(stream, self.resp, function(err){
                    self.done = true;
                    promise.resolve(true);
                });
            }, function (err) {
                delete self.headers['Content-Disposition'];
                promise.reject(err);
            } );
        }
        return promise;
    },

    /**
     * Set _Content-Type_ response header passed through `mime.type()`.
     *
     * Examples:
     *
     *     var filename = 'path/to/image.png';
     *     res.contentType(filename);
     *     // res.headers['Content-Type'] is now "image/png"
     *
     *     res.contentType('.html');
     *     res.contentType('html');
     *     res.contentType('json');
     *     res.contentType('png');
     *
     * @param {String} type
     * @return {String} the resolved mime type
     * @api public
     */

    contentType: function(type){
        if (!~type.indexOf('.')) type = '.' + type;
        return this.header('Content-Type', mime.type(type));
    },

    /**
     * Set _Content-Disposition_ header to _attachment_ with optional `filename`.
     *
     * @param {String} filename
     * @return {ServerResponse}
     * @api public
     */

    attachment: function(filename){
        this.header('Content-Disposition', filename
            ? 'attachment; filename="' + path.basename(filename) + '"'
            : 'attachment');
        return this;
    },

    /**
     * Transfer the file at the given `path`, with optional
     * `filename` as an attachment. Once transferred, or if an
     * error occurs `fn` is called with the error and path.
     *
     * @param {String} path
     * @param {String} filename
     * @param {Function} fn
     * @return {Type}
     * @api public
     */

    download: function(path, filename, fn){
        this.attachment(filename || path).sendfile(path, fn);
    },

    /**
     * Set or get response header `name` with optional `val`.
     *
     * Headers that may be set multiple times (as indicated by the `multiple` array)
     * can be called with a value several times, for example:
     *
     *    res.header('Set-Cookie', '...');
     *    res.header('Set-Cookie', '...');
     *
     * @param {String} name
     * @param {String} val
     * @return {String}
     * @api public
     */

    header: function(name, val){
      if (val === undefined) {
        return this.headers[name];
      } else {
        return this.multiple.indexOf(name)
          ? (this.headers[name] = this.headers[name] || []).push(val)
          : this.headers[name] = val;
      }
    },

    /**
     * Clear cookie `name`.
     *
     * @param {String} name
     * @api public
     */

    clearCookie: function(name){
        this.cookie(name, '', { expires: new Date(1) });
    },

    /**
     * Set cookie `name` to `val`.
     *
     * Examples:
     *
     *    // "Remember Me" for 15 minutes
     *    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
     *
     * @param {String} name
     * @param {String} val
     * @param {Options} options
     * @api public
     */

    setCookie: function(name, val, options){
        var cookie = this.cookie.encode(name, val, options);
        this.header('Set-Cookie', cookie);
    },

    /**
     * Redirect to the given `url` with optional response `status`
     * defaulting to 302.
     *
     * @param {String} url
     * @param {Number} status
     * @api public
     */
    redirect: function(url, status){
        var body;
        status = status || 302;

        // Support text/{plain,html} by default
        if (this.req.accepts('html')) {
            body = '<p>' + http.STATUS_CODES[status] + '. Redirecting to <a href="' + url + '">' + url + '</a></p>';
            this.header('Content-Type', 'text/html');
        } else {
            body = http.STATUS_CODES[status] + '. Redirecting to ' + url;
            this.header('Content-Type', 'text/plain');
        }

        // Respond
        this.header('Location', url);
        this.setContent(body);
        this.setStatus(status);
        //this.send();
    },

    setContent: function(content) {
        this.content = content;
    },

    getContent: function(){
        return this.content;
    },

    setStatus: function(status) {
        this.status = status;
    }
    
});



Response.Codes = {
    ok: 200,
    created: 201,
    accepted: 202,
    multiple: 300,
    moved: 301,
    notModified: 304,
    temporaryRedirect: 307,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    methodNotAllowed: 405,
    InternalError: 500,
    notImplemented: 501,
    serviceUnavailable: 503
};