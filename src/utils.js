var session = require('session');
var _ = require('lodash').noConflict();

var mediaBreakpoints = [
  {name: 'phone', value: 400, class:'media-phone'},
  {name: 'phablet', value: 560, class:'media-phablet'},
  {name: 'tablet', value: 768, class:'media-tablet'},
  {name: 'desktop', value: 1248, class:'media-desktop'}
];

var methods = {

  getBreakpoint: function() {
    return _.find(mediaBreakpoints, function(breakpoint) {
      return session.wrapper.clientWidth <= breakpoint.value;
    });
  },

  applyBreakpointClass: function() {
    var breakpoint = methods.getBreakpoint();
    if(breakpoint && breakpoint.class) {
      session.wrapper.dataset.breakpoint = breakpoint.class;
    } else {
      session.wrapper.dataset.breakpoint = '';
    }
  },

  checkBreakpoint: function(mediaKey) {
    var breakpoint = methods.getBreakpoint();
    return breakpoint && (breakpoint.name === mediaKey);
  },

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
