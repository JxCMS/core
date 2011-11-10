/**
 * This will be the main controller class that all controllers
 * will inherit from.
 */

var View = require('./view'),
    Promise = require('promise').Promise,
    when = require('promise').when;

var Controller_Main = exports.Controller_Main = new Class({

    Implements: [Options, Events],

    view: null,

    options: {},

    module: null,
    
    initialize: function(options) {
        this.setOptions(options);
    },

    dispatch: function(request, response){

        var promise = new Promise();

        var action = request.getParam('action') + '_action';
        if (typeOf(this[action]) === 'function') {
            core.info('Good path in Controller.... route it!');

            var self = this;

            self.before(request, response).then(function(){
                return core.call('beforeAction',[request,response]);
            }).then(function(){
                return self[action](request, response);
            }).then(function(){
                return core.call('afterAction',[request,response]);
            },function(err){
                //an error in the controller action is caught here
                core.debug('!!!controller action error', err);
                promise.reject(err);
            }).then(function(){
                return self.after(request, response);
            }).then(function(){
                promise.resolve(true);
            });

        } else {
            //redirect to 404 error page
            core.info('Bad path in Controller... throw to the 404 error will ya!');
            promise.reject('Action <' + action + '> does not exist on this controller.');
        }

        return promise;
        
    },


    before: function(request, response) {
        var promise = new Promise();
        //create the needed view
        response.view = View.createView(request, response, {});
        core.debug('view object',response.view);
        promise.resolve('true');
        return promise;
    },

    after: function(request, response) {
        var promise = new Promise();
        //render the view
        response.view.render().then(function(content){
            if (!nil(content)) {
                response.setContent(content);
                //core.debug('content we\'re returning',response.getContent());
            }
            promise.resolve('true');
        });
        return promise;
    },
    
    /**
     * Allows a reference to the module to be set.
     */
    setModule: function (module) {
        this.module = module;
    }
});
