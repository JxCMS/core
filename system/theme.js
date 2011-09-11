
var Promise = require('promise').Promise,
    when = require('promise').when,
    Settings = require('./settings').Settings,
    Theme = {};



Theme.setBase = function(view, promises){
    logger.info('in Theme.setBase');
    //logger.debug('Settings object', Settings);
    //logger.debug('view object in theme.setBase', view);
    
    var req = view.request,
        resp = view.response,
        domain = view.domain;

    //we should only do this with HTML responses and only when not
    //called by ajax.
    if (req.getParam('format','html') == 'html' && !req.isAjax()) {

        var s = new Settings();

        var promise = new Promise();
        when(s.find('theme.activeTheme', req, 'theme1', true), function(theme){
            logger.info('Theme directory = ' + theme);
            view.set('theme',theme);
            promise.resolve(true);
        });

        promises.push(promise);
    }

};

core.addEvent('preRender', Theme.setBase);