var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var scheduler = require('./scheduler/')

module.exports = function Store (opts) {
  if (!opts.request) { throw new Error("opts.request must be defined. Normally it's the ebt.request function") }

  var bundle = {
    name: 'sbot-replication-manager',
    getExtraArgs: function () {
      return {
        request: opts.request
      }
    }
  }

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, scheduler)

  return createStore()
}
