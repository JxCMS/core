
var Promise = require('promise').Promise,
    when = require('promise').when,
    Settings = require('./settings').Settings,
    Theme = {};



Theme.applyBase = function(req, resp, promises){
    core.log('in Theme.applyBase');
    //determine base template

    core.debug('Settings object', Settings);

    var s = new Settings();

    var promise = new Promise();
    when(s.find('theme.activeTheme', req, 'theme1', true), function(theme){
        core.log('Theme directory = ' + theme);
        //grab view and content
        var view = resp.view;
        view.setTemplate(theme + '/base');
        view.set('content', resp.getContent());
        core.log('content before = ' + resp.getContent());
        when(view.render(), function(content){
            resp.setContent(content);
            core.log('content after base = ' + resp.getContent());
            promise.resolve('true');
        });
    });

    promises.push(promise);

};

core.addEvent('afterDispatch', Theme.applyBase);