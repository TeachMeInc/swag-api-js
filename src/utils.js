var session = require('session');

var mediaBreakpoints = [
  {name: 'phone', value: 400, class:'media-phone'},
  {name: 'phablet', value: 800, class:'media-phablet'},
  {name: 'tablet', value: 1200, class:'media-tablet'},
  {name: 'desktop', value: 1400, class:'media-desktop', default: true}
];

var methods = {

  getBreakpoint: function() {
    var defaultBreakpoint = mediaBreakpoints.find(function(breakpoint) {
      return breakpoint.default;
    });
    var mmatch = mediaBreakpoints.find(function(breakpoint) {
      return session.wrapper.clientWidth <= breakpoint.value;
    });
    return mmatch || defaultBreakpoint;
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

  pick: function(o, props) {
    var entries = Object.assign({}, ...props.map(function(prop) {
      return { [prop]: o[prop] };
    }));
    return Object.fromEntries(Object.entries(entries).filter(([_, v]) => v != null));
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
