'use strict';

var config = require('config'),
    ui = require('./ui'),
    SWAGAPI = require('./api');

console.log('SWAG API ' + config.version);

module.exports = {
    getInstance: function(options) {
        return new SWAGAPI(options);
    },
    showBrandingAnimation: function(element, callback) {
        return ui.showBrandingAnimation(element, callback);
    },
    showLeaderboard: function(element, key, callback) {
        return ui.leaderboardComponent(element, key, callback);
    }
};
