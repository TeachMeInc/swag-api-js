'use strict';

var config = require('./config.js'),
    SWAGAPI = require('./api');

console.log('SWAG API ' + config.version);

module.exports = {
    getInstance: function(options) {
        return new SWAGAPI(options);
    }
};
