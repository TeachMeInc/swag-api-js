'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('config');
var utils = utils = require('utils');
var session = require('session');

var apiMethods = {
  'getEntity': '/v1/user',
  'getSubscriber': '/v1/subscriber',
  'getScoreCategories': '/v1/score/categories',
  'getDays': '/v1/days',
  'getScores': '/v1/scores',
  'getScoresContext': '/v1/scores/context',
  'postScore': '/v1/score',
  'postDailyScore': '/v1/dailyscore',
  'hasDailyScore': '/v1/scores/hasDailyScore',
  'getAchievementCategories': '/v1/achievement/categories',
  'postAchievement': '/v1/achievement',
  'getUserAchievements': '/v1/achievement/user',
  'postDatastore': '/v1/datastore',
  'getUserDatastore': '/v1/datastore/user',
  'getCurrentDay': '/v1/currentday'
};

var events = {
  DATA_EVENT: 'DATA_EVENT',
  DATA_ERROR: 'DATA_ERROR'
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

var methods = {
  // API
  buildUrlParamString: function(urlParams) {
    return '?' + _.map(_.keys(urlParams), function(key) {
      return key + '=' + formatParam(urlParams[key]);
    }).join('&');
  },

  getAPIData: function(options) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var apiRoot = session.apiRoot || config.apiRoot;

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
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject(response);
        }
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 0) {
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject();
        }
      };
      xhr.onError = function() {
        self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
        reject();
      };
      xhr.send();
    });
    return promise;
  },

  postAPIData: function(options) {
    var self = this;
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
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject(response);
        }
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 0) {
          self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject();
        }
      };
      xhr.onError = function() {
        self.emit(events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
        reject();
      };
      xhr.send(JSON.stringify(options.body));
    });
    return promise;
  },

  getEntity: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      if(session.uid) {
        session.entity = session.uid;
        resolve(session.uid);
      } else {
        self.getAPIData({
          method: apiMethods['getEntity']
        })
        .then(function(entity) {
          session.entity = entity;
          resolve(entity);
        });
      }
    });
    return promise;
  },

  isSubscriber: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      if(session.uid) {
        session.entity = session.uid;
        resolve(session.uid);
      } else {
        self.getAPIData({
          method: apiMethods['getSubscriber']
        })
        .then(function(result) {
          resolve(!!result.subscriber);
        });
      }
    });
    return promise;
  },

  hasDailyScore: function(level_key) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      if(session.uid) {
        session.entity = session.uid;
        resolve(session.uid);
      } else {
        self.getAPIData({
          method: apiMethods['hasDailyScore'],
          params: {
            game: session['api_key'],
            level_key: level_key
          }
        })
        .then(function(result) {
          resolve(!!result.daily_score);
        });
      }
    });
    return promise;
  },

  getScoreCategories: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getScoreCategories'],
        params: {
          game: session['api_key']
        }
      })
      .then(function(categories) {
        resolve(categories);
      });
    });
    return promise;
  },

  getDays: function(limit) {
    var self = this;
    var dayLimit = limit || 30;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getDays'],
        params: {
          limit: dayLimit
        }
      })
      .then(function(days) {
        resolve(days);
      });
    });
    return promise;
  },

  getScores: function(options) {
    var self = this,
        clean = _.pick(options,
          ['day', 'type', 'level_key', 'period', 'current_user', 'target_date', 'value_formatter', 'use_daily']),
        params = _.extend({game: session['api_key']}, clean);

    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getScores'],
        params: params
      })
      .then(function(scores) {
        resolve(scores);
      });
    });
    return promise;
  },

  getScoresContext: function(options) {
    var self = this,
        clean = _.pick(options,
          ['day', 'type', 'level_key', 'period', 'target_date', 'value_formatter']),
        params = _.extend({game: session['api_key']}, clean);

    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getScoresContext'],
        params: params
      })
      .then(function(scoresContext) {
        resolve(scoresContext);
      });
    });
    return promise;
  },

  postScore: function(level_key, value) {
    var self = this;
    var body = {
      game: session.api_key,
      level_key: level_key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: apiMethods['postScore'],
      body: body,
      params: urlParamsString
    });
  },

  postDailyScore: function(day, level_key, value) {
    var self = this;
    var body = {
      game: session.api_key,
      day: day,
      level_key: level_key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: apiMethods['postDailyScore'],
      body: body,
      params: urlParamsString
    });
  },

  getAchievementCategories: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getAchievementCategories'],
        params: {
          game: session['api_key']
        }
      })
      .then(function(categories) {
        resolve(categories);
      });
    });
    return promise;
  },

  getUserAchievements: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getUserAchievements'],
        params: {
          game: session['api_key']
        }
      })
      .then(function(achievements) {
        resolve(achievements);
      });
    });
    return promise;
  },

  postAchievement: function(achievement_key) {
    var self = this;
    var body = {
      game: session.api_key,
      achievement_key: achievement_key
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: apiMethods['postAchievement'],
      body: body,
      params: urlParamsString
    });
  },

  postDatastore: function(key, value) {
    var self = this;
    var body = {
      game: session.api_key,
      key: key,
      value: value
    };
    var urlParamsString = self.buildUrlParamString(body);
    return this.postAPIData({
      method: apiMethods['postDatastore'],
      body: body,
      params: urlParamsString
    });
  },

  getUserDatastore: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: apiMethods['getUserDatastore'],
        params: {
          game: session['api_key']
        }
      })
      .then(function(data) {
        resolve(data);
      });
    });
    return promise;
  },

  getCurrentDay: function() {
    var self = this;

    var padDateDigit = function(number) {
      if (number<=99) { number = ("000"+number).slice(-2); }
      return number;
    }

    var promise = new Promise(function(resolve, reject) {
      var urlParams = utils.parseUrlParams();
      if (urlParams.day && urlParams.month && urlParams.year) {
        var dayParts = [
          (2000 + parseInt (urlParams.year, 10)),
          padDateDigit(parseInt (urlParams.month, 10)),
          padDateDigit(parseInt (urlParams.day, 10))
        ];
        resolve({ day: dayParts.join("-") });
      } else {
        self.getAPIData({
          method: apiMethods['getCurrentDay'],
          params: {}
        })
        .then(function(data) {
          resolve(data);
        });
      }
    });

    return promise;
  }
};

module.exports = Emitter(methods);
