'use strict';

var SWAGAPI = require('./api');

module.exports = {
    getInstance: function(options) {
        return new SWAGAPI(options);
    }
};
