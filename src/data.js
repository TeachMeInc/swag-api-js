'use strict';

var Emitter = require('component-emitter');
var config = require('config');
var utils = utils = require('utils');
var session = require('session');

var provider = config.providers[session.provider] || config.providers['default'];

var methods = {

  events: {
    DATA_EVENT: 'DATA_EVENT',
    DATA_ERROR: 'DATA_ERROR',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT'
  },

  apiMethods: {
    'getEntity': '/v1/user',
    'getSubscriber': '/v1/subscriber',
    'getScoreCategories': '/v1/score/categories',
    'getDays': '/v1/days',
    'getScores': '/v1/scores',
    'getScoresContext': '/v1/scores/context',
    'hasDailyScore': '/v1/scores/hasDailyScore',
    'getAchievementCategories': '/v1/achievement/categories',
    'getUserAchievements': '/v1/achievement/user',
    'getUserDatastore': '/v1/datastore/user',
    'getCurrentDay': '/v1/currentday',
    'getTokenBalance': '/v1/tokenbalance',
    'getCurrentUser': provider.current,
    'userLogin': provider.login,
    'userLogout': provider.logout,
    'userCreate': provider.create
  },


  // API
  buildUrlParamString: function(params) {
    return params && params instanceof Object
      ? '?' + Object.keys(params).map(function(key) {
          return key + '=' + utils.formatParam(params[key]);
        }).join('&')
      : '';
  },

  getAPIData: function(options) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var rootUrl = options.apiRoot || session.apiRoot;
      var params = methods.buildUrlParamString(options.params);
      xhr.open('GET', encodeURI(rootUrl + options.method + params));
      xhr.withCredentials = true;
      xhr.onload = function() {
        var response = xhr.status === 200
          ? JSON.parse(xhr.response)
          : null;
        if(response && !response.error) {
          resolve(response);
        } else {
          self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject(response);
        }
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 0) {
          self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject();
        }
      };
      xhr.onError = function() {
        self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
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
      var rootUrl = options.apiRoot || session.apiRoot;
      var contentType = options.contentType || 'application/json;charset=UTF-8';
      xhr.open('POST', encodeURI(rootUrl + options.method), true);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.withCredentials = true;
      xhr.onload = function() {
        var response = xhr.status === 200
          ? JSON.parse(xhr.response)
          : null;
        if(response && !response.error) {
          resolve(response);
        } else {
          self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject(response);
        }
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 0) {
          self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
          reject();
        }
      };
      xhr.onError = function() {
        self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
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
          method: self.apiMethods['getEntity']
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
          method: self.apiMethods['getSubscriber']
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
          method: self.apiMethods['hasDailyScore'],
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
        method: self.apiMethods['getScoreCategories'],
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
        method: self.apiMethods['getDays'],
        params: {
          game: session['api_key'],
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
    const { day, type, level_key, period, current_user, target_date, value_formatter, use_daily} = options;
    var self = this,
        clean = { day, type, level_key, period, current_user, target_date, value_formatter, use_daily},
        params = Object.assign({game: session['api_key']}, clean);

    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: self.apiMethods['getScores'],
        params: params
      })
      .then(function(scores) {
        resolve(scores);
      });
    });
    return promise;
  },

  getScoresContext: function(options) {
    const { day, type, level_key, period, target_date, value_formatter} = options;
    var self = this,
        clean = { day, type, level_key, period, target_date, value_formatter},
        params = Object.assign({game: session['api_key']}, clean);

    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: self.apiMethods['getScoresContext'],
        params: params
      })
      .then(function(scoresContext) {
        resolve(scoresContext);
      });
    });
    return promise;
  },

  getAchievementCategories: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: self.apiMethods['getAchievementCategories'],
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
        method: self.apiMethods['getUserAchievements'],
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

  getUserDatastore: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      self.getAPIData({
        method: self.apiMethods['getUserDatastore'],
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
          method: self.apiMethods['getCurrentDay'],
          params: {}
        })
        .then(function(data) {
          resolve(data);
        });
      }
    });

    return promise;
  },

  getTokenBalance: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      if(session.uid) {
        session.entity = session.uid;
        resolve(session.uid);
      } else {
        self.getAPIData({
          method: self.apiMethods['getTokenBalance']
        })
        .then(function(result) {
          resolve(result);
        });
      }
    });
    return promise;
  },

  getCurrentUser: function() {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
        self.getAPIData({
          apiRoot: provider.root,
          method: provider.current
        })
        .then(function(result) {
          if(result && !result.error) {
            resolve(result);
          } else {
            reject();
          }
        });
    });
    return promise;
  },

  userLogin: function(options) {
    var self = this;
    const {username, password} = options;
    var body = { username, password };
    return self.postAPIData({
      apiRoot: provider.root,
      method: provider.login,
      body: body
    })
    .then(function(result) {
      if(result && !result.error) {
        self.emit(self.events.DATA_EVENT, self.events.USER_LOGIN);
        return result;
      } else {
        self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
      }
    })
    .catch(function(result) {
      return result;
    });
  },

  userCreate: function(options) {
    var self = this;
    const { username, mail, password } = options;
    var body = { username, mail, password };
    return self.postAPIData({
      apiRoot: provider.root,
      method: provider.create,
      body: body
    })
    .then(function(result) {
      if(result && !result.error) {
        self.emit(self.events.DATA_EVENT, self.events.USER_LOGIN);
        return result;
      } else {
        self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
      }
    })
    .catch(function(result) {
      return result;
    });
  },

  userLogout: function() {
    var self = this;
    return self.getAPIData({
      apiRoot: provider.root,
      method: provider.logout
    })
    .then(function(result) {
      if(result && !result.error) {
        self.emit(self.events.DATA_EVENT, self.events.USER_LOGOUT);
      } else {
        self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
      }
    })
    .catch(function(error) {
      self.emit(self.events.DATA_ERROR, config.events.API_COMMUNICATION_ERROR);
    });
  }
};

module.exports = Emitter(methods);
