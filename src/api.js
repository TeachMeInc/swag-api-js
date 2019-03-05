'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('config');
var preload = require('preload-js');
var elementResizeEvent = require('element-resize-event');

var templates = {
  dialog: require('templates/dialog.handlebars'),
  dialogHighscore: require('templates/dialog-highscores.handlebars'),
  dataHighscore: require('templates/data-highscores.handlebars')
};

var apiMethods = {
  'getEntity': '/v1/user',
  'getHighscoreCategories': '/v1/highscore/categories',
  'getHighScores': '/v1/highscores',
  'postHighscore': '/v1/highscore',
  'getAchievementCategories': '/v1/achievement/categories',
  'postAchievement': '/v1/achievement',
  'getUserAchievements': '/v1/achievement/user',
  'postDatastore': '/v1/datastore',
  'getUserDatastore': '/v1/datastore/user'
};

var dialogMethods = {
  'highscore': '_renderHighscoreDialog',
  'achievement': '_renderAchievementDialog'
};

var cleanSession = {
  entity: null,
  options: {}
};

var formatParam = function(param) {
  if(!Array.isArray(param)) {
    return param;
  }
  var formatted = _.map(param, function(item) {
    return '"' + item + '"';
  }).join('');
  return '[' + formatted + ']';
};

var toParam = function(source) {
  if(source) {
    return source.toLowerCase()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/[\s-]+/g, '-');
  } else {
    return '';
  }
};

// -----------------------------------------------------------------------------

function SWAGAPI(options) {
  this._options = _.pick(options, ['wrapper','api_key']);
  this._init();
  this._session.options = this._parseUrlOptions();
  Emitter(this);
}

var methods = {
  options: {},
  _wrapper: null,
  _session: JSON.parse(JSON.stringify(cleanSession)),
  _theme: '',

  // Events ------------------------------------------------------------------

    SESSION_READY: 'SESSION_READY',
    DIALOG_CLOSED: 'DIALOG_CLOSED',
    ERROR: 'ERROR',

  // Interface -----------------------------------------------------------------

  startSession: function() {
    var self = this;
    self._debug('start session');

    return Promise.all([
      this._getEntity()
    ])
      .then(function() {
        self._debug('session ready');
        self.emit(self.SESSION_READY);
      });
  },

  getHighscoreCategories: function() {
    var self = this;
    return self._getHighscoreCategories();
  },

  getHighScores: function(options) {
    var self = this;
    return self._getHighScores(options);
  },

  postHighscore: function(level_key, value) {
    var self = this;
    return self._postHighscore(level_key, value);
  },

  getAchievementCategories: function() {
    var self = this;
    return self._getAchievementCategories();
  },

  postAchievement: function(achievement_key) {
    var self = this;
    return self._postAchievement(achievement_key);
  },

  getUserAchievements: function() {
    var self = this;
    return self._getUserAchievements();
  },

  postDatastore: function(key, value) {
    var self = this;
    return self._postDatastore(key, value);
  },

  getUserDatastore: function() {
    var self = this;
    return self._getUserDatastore();
  },

  populateLevelSelect: function(domId) {
    var self = this;
    return self._populateLevelSelect(domId);
  },

  populateAchievementSelect: function(domId) {
    var self = this;
    return self._populateAchievementSelect(domId);
  },

  getCurrentEntity: function() {
    return this._session.entity;
  },

  showDialog: function(type) {
    return this._renderDialog(type);
  },

  // ---------------------------------------------------------------------------

  _init: function() {
    var self = this;
    this._wrapper = this._options.wrapper;
    this._wrapper.classList.add('swag-wrapper');
    this._theme = this._options.theme || 'shockwave';

    elementResizeEvent(this._wrapper, function() {
      self._resize();
    });
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
  },

  // API
  buildUrlParamString: function(urlParams) {
    return '?' + _.map(_.keys(urlParams), function(key) {
      return key + '=' + formatParam(urlParams[key]);
    }).join('&');
  },

  _getAPIData: function(options) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var apiRoot = self._session.options.apiRoot || config.apiRoot;

      var params = '?' + _.map(_.keys(options.params), function(key) {
        return key + '=' + formatParam(options.params[key]);
      }).join('&');

      xhr.open('GET', encodeURI(apiRoot + options.method + params));
      xhr.withCredentials = true;
      xhr.onload = function() {
        var response = xhr.status === 200
          ? JSON.parse(xhr.response)
          : null;
        if(response && !response.error) {
          resolve(response);
        } else {
          reject(response);
        }
      };
      xhr.send();
    });
    return promise;
  },

  _postAPIData: function(options) {
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', encodeURI(config.apiRoot + options.method), true);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.withCredentials = true;
      xhr.onload = function() {
        var response = xhr.status === 200
          ? JSON.parse(xhr.response)
          : null;
        if(response && !response.error) {
          resolve(response);
        } else {
          reject(response);
        }
      };
      xhr.send(JSON.stringify(options.body));
    });
    return promise;
  },

  _getEntity: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      if(self._session.options.uid) {
        self._session.entity = self._session.options.uid;
        resolve(self._session.options.uid);
      } else {
        self._getAPIData({
          method: apiMethods['getEntity']
        })
        .then(function(entity) {
          self._session.entity = entity;
          resolve(entity);
        });
      }
    });
    return promise;
  },

  _getHighscoreCategories: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self._getAPIData({
        method: apiMethods['getHighscoreCategories'],
        params: {
          game: self._options['api_key']
        }
      })
      .then(function(categories) {
        resolve(categories);
      });
    });
    return promise;
  },

  _getHighScores: function(options) {
    var self = this,
        clean = _.pick(options, ['type', 'level_key', 'period', 'current_user', 'reverse', 'target_date']),
        params = _.extend({game: self._options['api_key']}, clean);

    var promise = new Promise(function(resolve, reject) {
      self._getAPIData({
        method: apiMethods['getHighScores'],
        params: params
      })
      .then(function(scores) {
        resolve(scores);
      });
    });
    return promise;
  },

  _postHighscore: function(level_key, value) {
    var self = this;
    var body = {
      game: self._options.api_key,
      level_key: level_key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this._postAPIData({
      method: apiMethods['postHighscore'],
      body: body,
      params: urlParamsString
    });
  },

  _getAchievementCategories: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self._getAPIData({
        method: apiMethods['getAchievementCategories'],
        params: {
          game: self._options['api_key']
        }
      })
      .then(function(categories) {
        resolve(categories);
      });
    });
    return promise;
  },

  _getUserAchievements: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self._getAPIData({
        method: apiMethods['getUserAchievements'],
        params: {
          game: self._options['api_key']
        }
      })
      .then(function(achievements) {
        resolve(achievements);
      });
    });
    return promise;
  },

  _postAchievement: function(achievement_key) {
    var self = this;
    var body = {
      game: self._options.api_key,
      achievement_key: achievement_key
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this._postAPIData({
      method: apiMethods['postAchievement'],
      body: body,
      params: urlParamsString
    });
  },

  _postDatastore: function(key, value) {
    var self = this;
    var body = {
      game: self._options.api_key,
      key: key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this._postAPIData({
      method: apiMethods['postDatastore'],
      body: body,
      params: urlParamsString
    });
  },

  _getUserDatastore: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self._getAPIData({
        method: apiMethods['getUserDatastore'],
        params: {
          game: self._options['api_key']
        }
      })
      .then(function(data) {
        resolve(data);
      });
    });
    return promise;
  },

  // Dialogs

  _renderDialog: function(type) {
    var self = this;
    var dialogOptions = {
        theme: self._theme,
        header: {
            backButton: true
        }
    };

    var progressDialog = templates['dialog'](dialogOptions);
    this._cleanStage();
    this._wrapper.insertAdjacentHTML('afterbegin', progressDialog);
    var dialogEl = document.getElementById('swag-dialog');
    this._positionDialog(dialogEl);

    var backBtn = this._wrapper.querySelectorAll('div[data-action="back"]');
    _.each(backBtn, function(el) {
        el.addEventListener('click', function(event) {
            self._onCloseDialog(event);
        }, true);
    });

    if(dialogMethods[type]) {
      return self[dialogMethods[type]]();
    }

  },

  _renderHighscoreDialog: function() {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return self.getHighscoreCategories()
      .then(function(categories) {

        var progressDialog = templates['dialogHighscore']({
          levels: categories
        });

        contentEl.innerHTML = progressDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var periodSelector = document.getElementById('swag-data-view-period');
        var dataTableCont = document.getElementById('swag-data');

        var highScoreMethod = function(level_key, period) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');
          return self.getHighScores({
            level_key: level_key,
            period: period
          })
          .then(function(scores) {
            var formatted = templates['dataHighscore']({
              scores: scores
            });
            dataTableCont.innerHTML = formatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        }

        levelSelector.addEventListener('change', function() {
          return highScoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        periodSelector.addEventListener('change', function() {
          return highScoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
            periodSelector.options[periodSelector.selectedIndex].value);
        }, true);

        if(categories[0]) {
          return highScoreMethod(levelSelector.options[0].value, periodSelector.options[0].value);
        }

      });
  },

  _renderAchievementsDialog: function() {
  },

  // UI Rendering
  _resizeToContainer: function(element, container) {
    var max = 100;
    var attempts = 0;
    element.style.fontSize = null;
    var size = parseInt(window.getComputedStyle(element).fontSize);
    while(element.offsetHeight > container.offsetHeight && attempts < max && size > 0) {
      attempts++;
      size = Math.floor(size * 0.98);
      element.style.fontSize = size + 'px';
    }
  },

  _positionDialog: function(element) {
    var self = this;
    var contentContainers = element.getElementsByClassName('swag-dialog-content');
    var width = this._wrapper.offsetWidth * 0.80;
    var height = this._wrapper.offsetHeight * 0.80;
    var top = (this._wrapper.offsetHeight - height) / 2;
    var left = (this._wrapper.offsetWidth - width) / 2;

    self._debug('_positionDialog');
    self._debug('_positionDialog :::: wrapper', this._wrapper);
    self._debug('_positionDialog :::: wrapper - width', this._wrapper.offsetWidth);
    self._debug('_positionDialog :::: wrapper - height', this._wrapper.offsetHeight);

    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.top = top + 'px';
    element.style.left = left + 'px';
  },

  _resize: function() {
    var self = this;
    self._debug('resize');
    var elems = this._wrapper.getElementsByClassName('swag-dialog');
    _.each(elems, function(elem) {
      self._positionDialog(elem);
    });
  },

  _cleanStage: function() {
    var elems = this._wrapper.getElementsByClassName('swag-dialog');
    _.each(elems, function(elem) {
      elem.parentNode.removeChild(elem);
    });
  },

  _debug: function(message, data) {
    if(this._options.debug) {
      console.log('SWAG API :::: ' + message);
      if(data) {
        console.log(data);
      }
    }
  },

  _populateLevelSelect: function(domId) {
    var self = this;
    return self.getHighscoreCategories()
      .then(function(categories) {
        var levelSelect = document.getElementById(domId);
          categories.map(function(category) {
            var opt = document.createElement('option');
            opt.value= category.level_key;
            opt.innerHTML = category.name;
            levelSelect.appendChild(opt);
          });
      });
  },

  _populateAchievementSelect: function(domId) {
    var self = this;
    return self.getAchievementCategories()
      .then(function(categories) {
        var achievementSelect = document.getElementById(domId);
          categories.map(function(category) {
            var opt = document.createElement('option');
            opt.value= category.achievement_key;
            opt.innerHTML = category.name;
            achievementSelect.appendChild(opt);
          });
      });
  },

  _onCloseDialog: function() {
    event.preventDefault();
    this._cleanStage();
    this.emit(this.DIALOG_CLOSED);
  }

};

_.extend(SWAGAPI.prototype, methods);

module.exports = SWAGAPI;
