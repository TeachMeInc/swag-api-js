'use strict';

require('es6-promise').polyfill();

var _ = require('lodash').noConflict();
var Emitter = require('component-emitter');
var config = require('../config');
var elementResizeEvent = require('element-resize-event');
var bodyScrollLock = require('body-scroll-lock');
var utils = utils = require('../utils');
var ui = require('../ui.js');
var data = require('../data.js');
var session = require('../session.js');

function nextTick () {
  // This forces a repaint which allows the browser to populate the DOM
  // from any elements that have had their innerHTML changed before
  // this is called.
  return new Promise((resolve) => setTimeout(resolve, 0));
}

var methods = {

  events: {
    UI_EVENT: 'UI_EVENT',
    UI_ERROR: 'UI_ERROR'
  },

  templates: {
    'dialog': require('../templates/api/dialog.handlebars'),
    'dialogScore': require('../templates/api/dialog-scores.handlebars'),
    'dialogDailyScore': require('../templates/api/dialog-daily-scores.handlebars'),
    'dialogScoreConfirmation': require('../templates/api/dialog-score-confirmation.handlebars'),
    'dataScore': require('../templates/api/data-scores.handlebars'),
    'dataScoreContext': require('../templates/api/data-score-context.handlebars'),
    'dataDailyScoreContext': require('../templates/api/data-daily-scores-context.handlebars'),
    'dialogAchievements': require('../templates/api/dialog-achievements.handlebars'),
    'dataAchievements': require('../templates/api/data-achievements.handlebars'),
    'dialogWeeklyScores': require('../templates/api/dialog-weeklyscores.handlebars'),
    'dataWeeklyScores': require('../templates/api/data-weeklyscores.handlebars'),
    'brandingAnimation': require('../templates/api/branding-animation.handlebars'),
    'dialogUserLogin': require('../templates/api/dialog-user-login.handlebars'),
    'dialogUserCreate': require('../templates/api/dialog-user-create.handlebars'),
    'inlineUserLogin': require('../templates/api/inline-login.handlebars'),
  },

  dialogMethods: {
    'scores': 'renderScoresDialog',
    'dailyscores': 'renderDailyScoresDialog',
    'scoreconfirmation': 'renderScoreConfirmationDialog',
    'achievements': 'renderAchievementsDialog',
    'weeklyscores': 'renderWeeklyScoresDialog',
    'userlogin': 'renderUserLoginDialog',
    'usercreate': 'renderUserCreateDialog'
  },

  defaultDialogTitles: {
    'scores': 'Best Scores',
    'dailyscores': 'Best Daily Scores',
    'scoreconfirmation': 'Score Submitted',
    'weeklyscores': 'Your Best Scores This Week',
    'achievements': 'Your Achievements',
    'userlogin': 'Sign In'
  },

  renderInline: function(wrapperEl, innerClass) {
    wrapperEl.classList.add('swag-inline-wrapper');
    wrapperEl.classList.add(session.theme);
    wrapperEl.innerHTML = '';

    var innerEl = document.createElement('div');
    innerEl.classList.add(innerClass);
    wrapperEl.appendChild(innerEl);

    return innerEl;
  },

  renderDialog: function(type, options) {
    var self = this;
    var dialogOptions = _.extend({
        theme: session.theme,
        header: {
            backButton: true
        }
    }, options);

    var title = options && options.title || self.defaultDialogTitles[type];

    if(title) {
      dialogOptions.title = title;
    }

    var progressDialog = self.templates['dialog'](dialogOptions);
    this.cleanStage();
    session.wrapper.insertAdjacentHTML('afterbegin', progressDialog);
    var dialogEl = document.getElementById('swag-dialog');
    dialogEl.dataset['dialog'] = type;
    utils.applyBreakpointClass();

    bodyScrollLock.disableBodyScroll(session.wrapper);
    document.body.classList.add('swag-dialog-open');

    if(self.dialogMethods[type]) {
        return self[self.dialogMethods[type]](dialogOptions)
            .then(function() {
                var backBtn = session.wrapper.querySelectorAll('div[data-action="back"]');
                _.each(backBtn, function(el) {
                    el.addEventListener('click', function(event) {
                        self.onCloseDialog(event);
                    }, true);
                });

            });
    } else {
      this.emit(self.events.UI_ERROR, config.events.INVALID_DIALOG_TYPE);
    }

  },

  renderScores: function(options) {
    var self = this;
    var contentEl = options.el;

    return data
      .getScoreCategories()
      .then(function (categories) {
        var scoreDialog = self.templates['dialogScore']({
          levels: categories
        });
        contentEl.innerHTML = scoreDialog;

        nextTick().then(function () {
          var levelSelector = contentEl.querySelector('.swag-data-view-level');
          var periodSelector = contentEl.querySelector('.swag-data-view-period');
          var dataTableCont = contentEl.querySelector('.swag-data-table');
          var contextCont = contentEl.querySelector('.swag-score-context');
          var controlsCont = contentEl.querySelector('.swag-select-container');

          if(options.hideControls) {
            contextCont.innerHTML = '';
            contextCont.style.display = 'none';
            controlsCont.innerHTML = '';
            controlsCont.style.display = 'none';
          }

          if(options.period && periodSelector) {
            periodSelector.value = options.period;
          }

          if(categories.length <= 1) {
            levelSelector.style.display = 'none';
          }

          if(options.level_key && levelSelector) {
            levelSelector.value = options.level_key;
          }

          var scoreMethod = function(level_key, period) {
            dataTableCont.innerHTML = '';
            contentEl.classList.add('loading');

            var scoresContextOptions = {
              level_key: level_key,
              period: period
            };

            var scoresOptions = {
              type: 'standard',
              level_key: level_key,
              period: period
            };

            if(options.value_formatter) {
              scoresContextOptions.value_formatter = options.value_formatter;
              scoresOptions.value_formatter = options.value_formatter;
            }

            return Promise.all([
              data.getScoresContext(scoresContextOptions),
              data.getScores(scoresOptions)
            ])
              .then(function(values) {
                var scoresContext = values[0];
                var scores = values[1];

                var selectedCategory = _.find(categories, function(category) {
                  return level_key === category.level_key;
                });

                var formatted = self.templates['dataScore']({
                  category: selectedCategory,
                  scores: scores
                });

                dataTableCont.innerHTML = formatted;

                if (!options.hideControls) {
                  var contextFormatted = self.templates['dataScoreContext']({
                    context: scoresContext
                  });
                  contextCont.innerHTML = contextFormatted;
                }
              })
              .finally(function() {
                contentEl.classList.remove('loading');
              });
          };

          levelSelector.addEventListener('change', function() {
            return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
              periodSelector.options[periodSelector.selectedIndex].value);
          }, true);

          periodSelector.addEventListener('change', function() {
            return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value,
              periodSelector.options[periodSelector.selectedIndex].value);
          }, true);

          return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value, periodSelector.options[periodSelector.selectedIndex].value);
        });
      });
  },

  renderScoresDialog: function(options) {
    var self = this;
    options = options || {};
    options.el = document.getElementById('swag-dialog-content');

    return self.renderScores(options);
  },

  renderDailyScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return Promise.all([data.getDays(), data.getScoreCategories()])
      .then(function(values) {

        var days = values[0];
        var categories = values[1];

        var scoreDialog = self.templates['dialogDailyScore']({
          days: days,
          levels: categories
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var daySelector = document.getElementById('swag-data-view-day');
        var dataTableCont = document.getElementById('swag-data-table');
        var contextCont = document.getElementById('swag-score-context');

        if(options.day) {
          daySelector.value = options.day;
        }

        if(categories.length <= 1) {
          levelSelector.style.display = 'none';
        }

        if(options.level_key) {
          levelSelector.value = options.level_key;
        }

        var scoreMethod = function(day, level_key) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');

          var scoresContextOptions = {
            level_key: level_key,
            period: 'alltime',
            day: day
          };

          var scoresOptions = {
            type: 'daily',
            level_key: level_key,
            period: 'alltime', //daily scores are always displayed as all time
            day: day
          };

          if(options.value_formatter) {
            scoresContextOptions.value_formatter = options.value_formatter;
            scoresOptions.value_formatter = options.value_formatter;
          }

          return Promise.all([
            data.getScoresContext(scoresContextOptions),
            data.getScores(scoresOptions)
          ])
          .then(function(values) {

            var scoresContext = values[0];
            var scores = values[1];

            var selectedCategory = _.find(categories, function(category) {
              return level_key === category.level_key;
            });

            var formatted = self.templates['dataScore']({
              category: selectedCategory,
              scores: scores
            });

            dataTableCont.innerHTML = formatted;

            var contextFormatted = self.templates['dataDailyScoreContext']({
              context: scoresContext
            });

            contextCont.innerHTML = contextFormatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        daySelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        levelSelector.addEventListener('change', function() {
          return scoreMethod(daySelector.options[daySelector.selectedIndex].value,
            levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        return scoreMethod(daySelector.options[daySelector.selectedIndex].value, levelSelector.options[levelSelector.selectedIndex].value);

      });
  },

  renderScoreConfirmationDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');
    var scoreConfirmationDialog = self.templates['dialogScoreConfirmation'](options);
    contentEl.classList.remove('loading');
    contentEl.innerHTML = scoreConfirmationDialog;
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  renderAchievementsDialog: function(options) {

    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    var achievementsDialog = self.templates['dialogAchievements']();
    contentEl.innerHTML = achievementsDialog;

    var dataTableCont = document.getElementById('swag-data');

    var achievementsMethod = function() {
      dataTableCont.innerHTML = '';
      contentEl.classList.add('loading');
      return data.getUserAchievements()
      .then(function(achievements) {
        var formatted = self.templates['dataAchievements']({
          achievements: achievements
        });
        dataTableCont.innerHTML = formatted;
      })
      .finally(function() {
        contentEl.classList.remove('loading');
      });
    };

    return achievementsMethod();

  },

  renderWeeklyScoresDialog: function(options) {
    var self = this;
    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');

    return data.getScoreCategories()
      .then(function(categories) {

        var scoreDialog = self.templates['dialogWeeklyScores']({
          levels: categories,
          title: options.title
        });

        contentEl.innerHTML = scoreDialog;

        var levelSelector = document.getElementById('swag-data-view-level');
        var dataTableCont = document.getElementById('swag-data');

        var scoreMethod = function(level_key) {
          dataTableCont.innerHTML = '';
          contentEl.classList.add('loading');

          var scoresOptions = {
            type: 'weekly',
            level_key: level_key
          };

          if(options.value_formatter) {
            scoresOptions.value_formatter = options.value_formatter;
          }

          return data.getScores(scoresOptions)
          .then(function(scores) {
            var formatted = self.templates['dataWeeklyScores']({
              weeklyscores: scores
            });
            dataTableCont.innerHTML = formatted;
          })
          .finally(function() {
            contentEl.classList.remove('loading');
          });
        };

        levelSelector.addEventListener('change', function() {
          return scoreMethod(levelSelector.options[levelSelector.selectedIndex].value);
        }, true);

        if(categories[0]) {
          return scoreMethod(levelSelector.options[0].value);
        }

      });
  },

  renderUserLoginDialog: function(options) {
    var self = this;

    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');
    var scoreConfirmationDialog = self.templates['dialogUserLogin'](options);
    contentEl.classList.remove('loading');
    contentEl.innerHTML = scoreConfirmationDialog;
    var usernameInput = document.getElementById('swag-login-username');
    var passwordInput = document.getElementById('swag-login-password');
    var formSubmit = document.getElementById('swag-login-submit');
    var createButton = document.getElementById('swag-login-create');
    var messageCont = document.getElementById('swag-login-message');

    usernameInput.focus();

    var enterKeyListener = function(event) {
      if (event.keyCode === 13) {
        submitForm();
      }
    };

    var backBtn = session.wrapper.querySelectorAll('div[data-action="back"]');
    _.each(backBtn, function(el) {
        el.addEventListener('click', function(event) {
            window.removeEventListener('keypress', enterKeyListener, true);
        }, true);
    });

    var submitForm = function(event) {
      window.removeEventListener('keypress', enterKeyListener, true);
      formSubmit.classList.add('loading');
      formSubmit.disabled = true;
      messageCont.innerHTML = '';
      data.userLogin({
        username: usernameInput.value,
        password: passwordInput.value
      })
        .then(function(result) {
          formSubmit.classList.remove('loading');
          formSubmit.disabled = false;
          if(result && !result.error) {
            self.cleanStage();
            window.removeEventListener('keypress', enterKeyListener, true);
            self.emit(self.events.USER_LOGIN, { auth: true });
          } else {
            if(result && result.error) {
              messageCont.innerHTML = '<p class="animated fadeIn">' + result.error + '</p>';
              window.addEventListener('keypress', enterKeyListener, true);
            }
          }
        });
    };

    formSubmit.addEventListener('click', function(event) {
      event.preventDefault();
      submitForm(event);
    }, true);

    createButton.addEventListener('click', function(event) {
      event.preventDefault();
      self.cleanStage();
      self.renderDialog('usercreate',{});
    }, true);

    window.addEventListener('keypress', enterKeyListener, true);

    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  renderUserCreateDialog: function(options) {
    var self = this;

    var dialogEl = document.getElementById('swag-dialog');
    var contentEl = document.getElementById('swag-dialog-content');
    var scoreConfirmationDialog = self.templates['dialogUserCreate'](options);
    contentEl.classList.remove('loading');
    contentEl.innerHTML = scoreConfirmationDialog;
    var usernameInput = document.getElementById('swag-logincreate-username');
    var emailInput = document.getElementById('swag-logincreate-mail');
    var passwordInput = document.getElementById('swag-logincreate-password');
    var formSubmit = document.getElementById('swag-logincreate-submit');
    var messageCont = document.getElementById('swag-logincreate-message');

    usernameInput.focus();

    var enterKeyListener = function(event) {
      if (event.keyCode === 13) {
        submitForm();
      }
    };

    var backBtn = session.wrapper.querySelectorAll('div[data-action="back"]');
    _.each(backBtn, function(el) {
        el.addEventListener('click', function(event) {
            window.removeEventListener('keypress', enterKeyListener, true);
        }, true);
    });

    var submitForm = function(event) {
      window.removeEventListener('keypress', enterKeyListener, true);
      formSubmit.classList.add('loading');
      formSubmit.disabled = true;
      messageCont.innerHTML = '';
      data.userCreate({
        username: usernameInput.value,
        mail: emailInput.value,
        password: passwordInput.value
      })
        .then(function(result) {
          formSubmit.classList.remove('loading');
          formSubmit.disabled = false;
          if(result && !result.error) {
            self.cleanStage();
            window.removeEventListener('keypress', enterKeyListener, true);
          } else {
            if(result && result.error) {
              messageCont.innerHTML = '<p class="animated fadeIn">' + result.error + '</p>';
              window.addEventListener('keypress', enterKeyListener, true);
            }
          }
        });
    };

    formSubmit.addEventListener('click', function(event) {
      event.preventDefault();
      submitForm(event);
    }, true);

    window.addEventListener('keypress', enterKeyListener, true);

    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  renderInlineLogin: function(options) {
    var self = this;
    var contentEl = options.el;

    var renderOptions = {};

    renderOptions.loginButtonText = options.loginButtonText || 'Login';
    renderOptions.loginButtonHref = options.loginButtonHref;

    var registerLink = `<a class="swag-register-link"${options.registerLinkHref ? ` href="${options.registerLinkHref}"` : ''}>${options.registerLinkText || 'Register'}</a>`;
    renderOptions.registerBlock = (options.registerText || '{registerLink}');
    renderOptions.registerBlock = renderOptions.registerBlock.replace('{registerLink}', registerLink);

    var inlineLogin = self.templates['inlineUserLogin'](renderOptions);
    contentEl.innerHTML = inlineLogin;

    nextTick().then(function () {
      var wrapperEl = document.getElementById('swag-api-wrapper');
      var wrapperBrect = wrapperEl.getBoundingClientRect();

      var loginEl = contentEl.querySelector('.swag-login-button');
      if (!options.loginButtonHref) {
        if (options.loginButtonAction) {
          loginEl.addEventListener('click', options.loginButtonAction, true);
        } else {
          loginEl.addEventListener('click', function () {
            window.scrollTo({ y: wrapperBrect.y });
            self.renderDialog('userlogin', {});
          }, true);
        }
      }

      var registerEl = contentEl.querySelector('.swag-register-link');
      if (!options.registerLinkHref) {
        if (options.registerLinkAction) {
          registerEl.addEventListener('click', options.registerLinkAction, true);
        } else {
          registerEl.addEventListener('click', function () {
            window.scrollTo({ y: wrapperBrect.y });
            self.renderDialog('usercreate', {});
          }, true);
        }
      }
    })
  },

  // UI Rendering
  cleanStage: function() {
    bodyScrollLock.clearAllBodyScrollLocks()
    document.body.classList.remove('swag-dialog-open');
    var elems = session.wrapper.getElementsByClassName('swag-dialog-wrapper');
    _.each(elems, function(elem) {
      elem.parentNode.removeChild(elem);
    });
  },

  populateLevelSelect: function(domId) {
    var self = this;
    return data.getScoreCategories()
      .then(function(categories) {
        var levelSelect = document.getElementById(domId);
        if(levelSelect) {
          categories.map(function(category) {
            var opt = document.createElement('option');
            opt.value= category.level_key;
            opt.innerHTML = category.name;
            levelSelect.appendChild(opt);
          });
        }
      });
  },

  populateDaySelect: function(domId, limit) {
    var self = this;
    return data.getDays(limit)
      .then(function(days) {
        var daySelect = document.getElementById(domId);
        if(daySelect) {
          days.map(function(day) {
            var opt = document.createElement('option');
            opt.value= day;
            opt.innerHTML = day;
            daySelect.appendChild(opt);
          });
        }
      });
  },

  resize: function() {
    utils.debug('resize');
    utils.applyBreakpointClass();
  },

  populateAchievementSelect: function(domId) {
    var self = this;
    return data.getAchievementCategories()
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

  startGame: function() {
    return new Promise(function(resolve,reject) {
      console.log('::: start game method invoked :::');
      resolve({});
    });
  },

  endGame: function() {
    return new Promise(function(resolve,reject) {
      console.log('::: end game method invoked :::');
      resolve({});
    });
  },

  showAd: function() {
    return new Promise(function(resolve,reject) {
      resolve({});
    });
  },

  getBrandingLogo: function() {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        resolve(img);
      };
      //TODO: use appropriate logo for given context
      img.src = config.resourceRoot + 'shockwave-logo.svg';
    });
  },

  getBrandingLogoUrl: function() {
    return new Promise(function(resolve, reject) {
      resolve(config.resourceRoot + 'shockwave-logo.svg');
    });
  },

  showBrandingAnimation: function(targetElement, callback) {
    var self = this;
    var el = document.getElementById(targetElement);
    return new Promise(function(resolve, reject) {
      var animationMarkup = self.templates['brandingAnimation']();
      el.insertAdjacentHTML('afterbegin', animationMarkup);
      el.classList.add('swag-branding-active');
      var wrapper = document.getElementById('swag-branding-animation-wrapper');
      var anim = document.getElementById('swag-branding-animation');
      anim.onload = function() {
        window.setTimeout(function() {
            wrapper.parentNode.removeChild(wrapper);
            el.classList.remove('swag-branding-active');
            if(callback) callback();
            resolve();
        }, 4500);
      };
    });
  },

  onCloseDialog: function(event) {
    var self = this;
    event.preventDefault();
    this.cleanStage();
    this.emit(self.events.UI_EVENT, config.events.DIALOG_CLOSED);
  }
};

module.exports = _.extend(ui, methods);
