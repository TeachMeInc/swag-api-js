### SWAG API DEVELOPERS GUIDE

Include the following files:

```
<script type-"text/javascript"src="https://swagapi.shockwave.com/dist/swag-api.js">
<link rel="stylesheet" type="text/css" href="https://swagapi.shockwave.com/dist/swag-api.css">
```

The API is also available as an npm package _(not yet implemented)_

```
  npm install swag-api-js
```

## Connecting to the API

SWAGPI will be accessible as a global

```
  var api = SWAGAPI.getInstance({
    wrapper: wrapper,
    api_key: '5c6c3c056917a692f96f9651',
    theme: 'shockwave',
    debug: true
  });
```

##### API options:

| option        | type           | description  |
| ------------- | ------------- | ----- |
|wrapper|domElement|the domElement containing the game
|api_key|String|unique identifier for the game
|theme|String|set the theme for api ui elements
|debug|boolean|enable debug console messages

 The client must use the `startSession` method to start using the api and wait for the promise to resolve or the SESSION_READY event before using any other api calls.

Using promise:
```
  return api.startSession()
    .then(function() {
        //do stuff
    });
```

Using event listener:
```
  api.on('SESSION_READY', function() {
    //do stuff
  });
```

## Using the API

#####  API Methods:

All methods return promises

| method        | parameters           |  description |
| ------------- | ------------- | ----- |
| startSession| - | Used start an api session.  The client must wait for the promise to resolve or the SESSION_READY event before using any other api calls.
|getHighscoreCategories| - | Returns a json array of highscore categories associated with this game
|getHighScores| period `(daily, weekly, monthly, alltime),` level_key, useEntity | Return a json array of global high scores for the specified `period` and `level_key`.  If `useEntity` is true, will retrieve score for only the current user.
|postHighscore| level_key, value | Post the score `value` for the `level_key` for the current user.
|getAchievementCategories| - | Return a json array of achievements associated with this game
|postAchievement| achievement_key | Post an achievement `achievement_key` for the current user
|getUserAchievements| - | Return a list of all achievements by the current user for this game
|postDatastore| key, value | Post a `value` to `key`.  If 'key' exists for this user, it will be overwritten.
|getUserDatastore| - | Returns a json array of all data store objects associated with this user
|displayHighScoreDialog | - | Display the api highscore dialog *_not yet implelmented_
|displayAchievementDialog | - | Display the api achievement dialog *_not yet implelmented_
|getServerDate | - | Used to get server time to decide which day it is in daily games *_not yet implelmented_

#####  API Events:

| event        | description |
| ------------- | ------------- |
| SESSION_READY | The api is ready to use
| ERROR | An api error has occurred
| HIGHSCORE_DIALOG_CLOSED | The high score dialog has closed
| ACHIEVEMENT_DIALOG_CLOSED | The achievement dialog has closed
