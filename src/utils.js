var session = require('session');

var methods = {

  formatParam: function(param) {
    if(!Array.isArray(param)) {
      return param;
    }
    var formatted = _.map(param, function(item) {
      return '"' + item + '"';
    }).join('');
    return '[' + formatted + ']';
  },

  toParam: function(source) {
    if(source) {
      return source.toLowerCase()
        .replace(/[^a-z0-9-\s]/g, '')
        .replace(/[\s-]+/g, '-');
    } else {
      return '';
    }
  },

  parseUrlParams: function() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
  },

  debug: function(message, data) {
    if(session.debug) {
      console.log('SWAG API :::: ' + message);
      if(data) {
        console.log(data);
      }
    }
  }
};

module.exports = methods;
