'use strict';

var Emitter = require('component-emitter');
var config = require('config');
var elementResizeEvent = require('element-resize-event');
var session = require('../session');
var data = require('./data');
var ui = require('./ui');
var utils = require('../utils');

var _isRendering = false;
// -----------------------------------------------------------------------------

function SWAGAPI(options) {
  var self = this;
  this._options = utils.pick(options, ['wrapper', 'api_key', 'keyword']);
  this._init();
  Emitter(this);

  ui.on('UI_EVENT', function(event) {
    self.emit(event, {type: event});
  });

  ui.on('UI_ERROR', function(event) {
    self._emitError(event);
  });

  ui.on('DATA_ERROR', function(event) {
    self._emitError(event);
  });

  data.on('DATA_EVENT', function(event) {
    self.emit('DATA_EVENT', {type: event});
  });

  data.on('DATA_ERROR', function(event) {
    self._emitError(event);
  });

};

var methods = {

  // Interface -----------------------------------------------------------------

  startSession: function() {
    var self = this;
    utils.debug('start session');

      return data.getAPIKey()
        .then(function (key) {
          session.api_key = key.game;
          return data.getEntity()
            .then(function() {
              utils.debug('session ready');
              self.emit(config.events.SESSION_READY, { session_ready: true });
            });
        })
        .catch(function() {
          self.emit(config.events.ERROR, { message: 'Could not find game.  Please check api key'});
        });
  },

  getScoreCategories: function() {
    return data.getScoreCategories();
  },

  getDays: function(limit) {
    return data.getDays(limit);
  },

  getScores: function(options) {
    return data.getScores(options);
  },

  postScore: function(level_key, value, options) {
    return data.postScore(level_key, value, options)
      .then(function() {
        if(options && options.confirmation === true) {
          ui.renderDialog('scoreconfirmation', { value: value });
        }
      });
  },

  postDailyScore: function(day, level_key, value) {
    return data.postDailyScore(day, level_key, value);
  },

  getAchievementCategories: function() {
    return data.getAchievementCategories();
  },

  postAchievement: function(achievement_key) {
    return data.postAchievement(achievement_key);
  },

  getUserAchievements: function() {
    return data.getUserAchievements();
  },

  postDatastore: function(key, value) {
    return data.postDatastore(key, value);
  },

  getUserDatastore: function() {
    return data.getUserDatastore();
  },

  populateLevelSelect: function(domId) {
    return ui.populateLevelSelect(domId);
  },

  populateDaySelect: function(domId, limit) {
    return ui.populateDaySelect(domId, limit);
  },

  populateAchievementSelect: function(domId) {
    return ui.populateAchievementSelect(domId);
  },

  getCurrentEntity: function() {
    return session.entity;
  },

  showDialog: function(type, options) {
    return ui.renderDialog(type, options);
  },

  isSubscriber: function() {
    return data.isSubscriber();
  },

  hasDailyScore: function(level_key) {
    return data.hasDailyScore(level_key);
  },

  getCurrentDay: function() {
    return data.getCurrentDay();
  },

  getBrandingLogo: function() {
    return ui.getBrandingLogo();
  },

  getBrandingLogoUrl: function() {
    return ui.getBrandingLogoUrl();
  },

  startGame: function() {
    return ui.startGame();
  },

  endGame: function() {
    return ui.endGame();
  },

  showAd: function() {
    return ui.showAd();
  },

  postExternalMessage: function(message) {
    return data.postExternalMessage(message);
  },

  getCurrentUser: function() {
    return data.getCurrentUser();
  },

  userLogout:  function() {
    return data.userLogout();
  },

  renderTokenBalance: function(options) {
    options.el = ui.renderEmbed(options.el, 'swag-token-section');
    return ui.renderTokenBalance(options, true);
  },

  renderFriendsSection: function(options) {
    options.el = ui.renderEmbed(options.el, 'swag-friends-section');
    return ui.renderScores(options, true);
  },

  renderScoresSection: function(options) {
    options.el = ui.renderEmbed(options.el, 'swag-scores-section');
    return ui.renderScores(options, true);
  },

  setScoreView: function(level_key, period) {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent('changeScoreView', false, false, { level_key, period });
    window.dispatchEvent(evt);
  },

  // ---------------------------------------------------------------------------

  _init: function() {
    var self = this;
    var siteMode = this._getSiteMode();

    session.api_key = this._options.api_key;

    if (this._options.wrapper) {
      session.wrapper = this._options.wrapper;
      session.wrapper.classList.add('swag-dialog-wrapper');
    }

    session.keyword = this._options.keyword;
    session.theme = siteMode;
    session.keywordtype = siteMode;
    session.apiRoot = config.themes[siteMode].apiRoot;

    //wrapper
    if(this._options.wrapper) {
      session.wrapper = this._options.wrapper;
      session.wrapper.classList.add('swag-wrapper');

      elementResizeEvent(session.wrapper, function() {
        _isRendering = setTimeout(function() {
          ui.resize();
        }, 400);
      });
    }
  },

  _getSiteMode: function() {
    var reqTheme = window.SWAGTHEME;
    return config.themes[reqTheme]
      ? reqTheme
      : 'shockwave';
  },

  _emitError: function(errorType) {
    this.emit(this.ERROR, { type: errorType });
  },

  _parseUrlOptions: function(prop) {
    var params = {};
    if(window.location.href.indexOf('?') === -1) {
      return params;
    }
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );
    definitions.forEach( function( val, key ) {
      var parts = val.split( '=', 2 );
      params[ parts[ 0 ] ] = parts[ 1 ];
    } );
    return ( prop && prop in params ) ? params[ prop ] : params;
  }

};

Object.assign(SWAGAPI.prototype, methods);

module.exports = SWAGAPI;
