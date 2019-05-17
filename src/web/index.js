'use strict';

var config = require('../config.js'),
    SWAGWEB = require('./web.js');

console.log('SWAG WEB ' + config.version);

module.exports = {
    getInstance: function(options) {
        return new SWAGWEB(options);
    }
};
