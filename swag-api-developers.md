# SWAG API DEVELOPERS GUIDE

Include the following files:

```
<script type="text/javascript" src="https://swagapi.shockwave.com/dist/swag-api.js">
<link rel="stylesheet" type="text/css" href="https://swagapi.shockwave.com/dist/swag-api.css">
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

<div class="page-break"></div>

## Using the API

####  API Methods:

All methods return promises

| method        | parameters           |  description |
| ------------- | ------------- | ----- |
| startSession| - | Used start an api session.  The client must wait for the promise to resolve or the SESSION_READY event before using any other api calls.
|getHighscoreCategories| - | Returns a json array of highscore categories associated with this game
|getHighScores| see getHighScores options | Returns a json array of highscores based on the options objects
|postHighscore| level_key, value | Post the score `value` for the `level_key` for the current user.
|getAchievementCategories| - | Return a json array of achievements associated with this game
|postAchievement| achievement_key | Post an achievement `achievement_key` for the current user
|getUserAchievements| - | Return a list of all achievements by the current user for this game
|postDatastore| key, value | Post a `value` to `key`.  If 'key' exists for this user, it will be overwritten.
|getUserDatastore| - | Returns a json array of all data store objects associated with this user
|showDialog | type | display a dialog of type `highscore`, `achievements` or `weeklyscores`
|getServerDate | - | Used to get server time to decide which day it is in daily games *_not yet implelmented_

<div class="page-break"></div>

### getHighScores options

The following options are available:

| options        | required           |  description |
| ------------- | ------------- | ----- |
|level_key|yes|The level to retrieve high scores for.
|type|no|String, _default:_ `"standard"`, _values:_ `"standard", "weekly"`
|period|no|String, _default:_ `"alltime"`, _values:_ `"daily", "weekly", "monthly", "alltime"`
|current_user|no|boolean, _default:_ `false`.  If true, only get highscores for current user
|reverse|no|boolean, _default:_ `false`.  If true, get lowest scores
|target_date|no|number, epoch time.  Use this date as the base for date ranges eg. "daily", "weekly"

Example (high scores this week on level1 for the current user):

```
return api.getHighScores({
  type: 'weekly',
  level_key: 'level1',
  current_user: true
})
  .then(function(scores) {
    //do something
  });
```


###  API Events:

| event        | description |
| ------------- | ------------- |
| SESSION_READY | The api is ready to use
| ERROR | An api error has occurred
| HIGHSCORE_DIALOG_CLOSED | The high score dialog has closed
| ACHIEVEMENT_DIALOG_CLOSED | The achievement dialog has closed

### Demo

There is a simple demo of the api at:

http://swagapi.shockwave.com/demo.html (view source)


## Developing and Using Locally

For now you will need to edit your etc\hosts file.

On Windows you can find at c:windows\system32\drivers\etc\host

and add the following line

```
127.0.0.1			local.shockwave.com
```

Install http-server

```
npm install -g http-server
```

Launch a local web server where your index.html is

```
http-server -p 8888
```

You can either be logged into shockwave.com or as a guest when testing.

To get an API key or anything else, please contact your support at Addicting Games.

launch your game with

```
http://local.shockwave.com:8888
```
