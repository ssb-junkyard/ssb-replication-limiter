var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var peers = require('./peers/')
var scheduler = require('./scheduler')

module.exports = function Store (opts) {
  if (!opts.request) { throw new Error("opts.request must be defined. Normally it's the ebt.request function") }
  if (!opts.getPeerBehindBy) { throw new Error('opts.getPeerBehindBy must be defined.') }

  if (opts && opts.peers && opts.peers.initialState) {
    peers.initialState = opts.peers.initialState
  }
  var bundle = {
    name: 'sbot-replication-manager',
    getExtraArgs: function () {
      return {
        request: opts.request,
        getPeerBehindBy: opts.getPeerBehindBy
      }
    }
  }

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, peers, scheduler)

  return createStore()
}
