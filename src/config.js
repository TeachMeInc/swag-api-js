module.exports = {
    version: '2.0.4',
    themes: {
      'shockwave': {
        apiRoot: 'https://swag-services.shockwave.com'
      },
      'addictinggames': {
        apiRoot: 'https://swag-services.addictinggames.com'
      }
    },
    resourceRoot: 'https://swagapi.shockwave.com/dist/',
    events: {
      API_COMMUNICATION_ERROR: 'API_COMMUNICATION_ERROR',
      SESSION_READY: 'SESSION_READY',
      DIALOG_CLOSED: 'DIALOG_CLOSED',
      INVALID_DIALOG_TYPE: 'INVALID_DIALOG_TYPE',
      ERROR: 'ERROR',
      INVALID_MESSAGE: 'INVALID MESSAGE'
    }
};
