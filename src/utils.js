var session = require('session');

var methods = {
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
