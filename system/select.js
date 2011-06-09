/**
 * Class: Select
 * 
 * This class is a helper for creating queries. It allows you to chain selection
 * criteria and then it returns a valid object for use in find queries
 */

var Select = exports.Select = new Class({
    
    query: null,
    fields: null,
    options: null,
    collection: null,
    
    initialize: function(collection){
        this.query = {};
        this.fields = {};
        this.options = {};
        if (collection) {
            this.collection = collection;
        }
    },
    
    field: function(field) {
        this.fields[field] = true;
        return this;
    },
    
    skip: function(skip) {
        this.options.skip = skip;
        return this;
    },
    
    limit: function(limit) {
        this.options.limit = limit;
        return this;
    },
    
    sortAsc: function(field){
        if (nil(this.options.sort)) {
            this.options.sort = [];
        }
        
        this.options.sort.push([field,'asc']);
        return this;
    },
    
    sortDesc:  function(field){
        if (nil(this.options.sort)) {
            this.options.sort = [];
        }
        
        this.options.sort.push([field,'desc']);
        return this;
    },
    
    where: function(expression){
        var obj = this.collection.translateExpression(expression);
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    and: function(expression){
        var obj = this.collection.translateExpression(expression);
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    or: function(expression){
        var obj = this.collection.translateExpression(expression,true);
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    'in': function(field, arr){
        var obj = {};
        obj[field] = {$in: arr};
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    nin: function(field, arr) {
        var obj = {};
        obj[field] = {$nin: arr};
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    all: function(field, arr) {
        var obj = {};
        obj[field] = {$all: arr};
        this.query = Object.merge(this.query, obj);
        return this;   
    },
    
    exists: function(field) {
        var obj = {};
        obj[field] = {$exists: true};
        this.query = Object.merge(this.query, obj);
        return this;
    },
    
    mod: function(field, div, rem) {
        var obj = {};
        obj[field] = {$mod: [div,rem]};
        this.query = Object.merge(this.query, obj);
        return this;   
    },
    
    size: function(field, size){
        var obj = {};
        obj[field] = {$size: size};
        this.query = Object.merge(this.query, obj);
        return this;
    }
    
    
});