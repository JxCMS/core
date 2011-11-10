var http = require("http"),
    url = require("url"),
    multipart = require("multipart/lib/multipart"),
    sys = require("sys"),
    fs = require("fs"),
    querystring = require('querystring'),
    Promise = require('promise').Promise;


exports.Multipart = new Class({

    initialize: function(req){
        this.request = req;
        this.request.setEncoding("binary");
        this.fileStream = null;
        this.flag = false;
        this.params = {};
        this.currentKey = null;

        this.uploadLocation = core.getOption('upload_dir');
    },

    parse: function(){
        this.parse_multipart();
        stream.onPartBegin = this.onPartBegin.bind(this);
        stream.onData = this.onData.bind(this);
        stream.onEnd = this.onEnd.bind(this);

        //create a promise and send it back
        this.promise = new Promise();
        return this.promise;
    },

    parse_multipart: function(){
        var parser = multipart.parser();
        parser.headers = this.request.headers;

        this.request.addListener("data", function(chunk){
            parser.write(chunk);
        });

        this.request.addlistener("end", function(){
            parser.close();
        });

        this.stream = parser;
    },

    onPartBegin: function(part){
        if (!part.filename) {
            this.flag = true;
            this.currentKey = part.name;
        } else {
            this.params[part.name] = part.filename;
        }

        if (this.flag) {
            var filename = this.uploadLocation + part.filename;

            this.fileStream = fs.createWriteStream(filename);

            this.fileStream.addListener("error", function(err){
                //for now, output debug
                sys.debug("Got error while writing to file '" + fileName + "': ", err);
                //TODO: add more robust error handling
            });

            this.fileStream.addListener("drain", function(){
                this.request.resume();
            });
        }

    },

    onData: function(chunk){
        this.request.pause();

        if (!this.flag) {
            this.fileStream.write(chunk);
        } else {
            this.flag = false;
            this.params[this.currentKey] = chunk;
        }
    },

    onEnd: function(){
        this.fileStream.addListener("drain", function(){
            this.fileStream.end();
            this.promise.resolve(this.params);
        }.bind(this))
    }
});

exports.Simple = new Class({

    data: null,

    methods: {
        'json': JSON.decode,
        'form': require('querystring').parse
    },

    initialize: function(req){
        this.request = req;
        if (this.request.headers.content-type.contains('json')){
            this.decoder = this.methods.json;
        } else {
            this.decoder = this.methods.form;
        }
    },

    parse: function(){
        this.request.addListener("data", function(chunk){
            this.data += chunk;
        }.bind(this));
        this.request.addListener("end", function(){
            this.params = this.decoder(this.data);
            this.promise.resolve(this.params);
        }.bind(this));
        this.promise = new Promise();
        return this.promise;
    }
});

/**
 * Cookie parsing and encoding taken from Sencha's connect framework (specifically the utilities).
 */
exports.Cookie = new Class({

    encode: function(name, val, obj){
        var pairs = [name + '=' + querystring.escape(val)],
            obj = obj || {},
            keys = Object.keys(obj);
        for (var i = 0, len = keys.length; i < len; ++i) {
            var key = keys[i],
                val = obj[key];
            if (val instanceof Date) {
                val = val.toUTCString();
            } else if (typeof val === "boolean") {
                if (val === true) {
                    pairs.push(key);
                }
                continue;
            }
            pairs.push(key + '=' + val);
        }
        return pairs.join('; ');
    },

    decode: function(str){
        core.info('cookie string passed to decode: ' + str);
        var obj = {},
            pairs = str.split(/[;,] */);
        for (var i = 0, len = pairs.length; i < len; ++i) {
            var pair = pairs[i],
                eqlIndex = pair.indexOf('='),
                key = pair.substr(0, eqlIndex).trim().toLowerCase(),
                val = pair.substr(++eqlIndex, pair.length).trim();
            // Quoted values
            if (val[0] === '"') {
                val = val.slice(1, -1);
            }
            // Only assign once
            if (obj[key] === undefined) {
                obj[key] = querystring.unescape(val, true);
            }
        }

        core.debug('Object returning from cookie.decode', obj);

        return obj;
    }
});
