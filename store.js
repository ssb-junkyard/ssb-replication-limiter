var {composeBundlesRaw, debugBundle, createReactorBundle} = require('redux-bundler')
var peers = require('./peers/')
var scheduler = require('./scheduler')

module.exports = function Store (opts) {
  if (!opts.request) { throw new Error("opts.request must be defined. Normally it's the ebt.request function") }
  if (!opts.getPeerAheadBy) { throw new Error('opts.getPeerAheadBy must be defined.') }

  if (opts && opts.peers && opts.peers.initialState) {
    peers.initialState = opts.peers.initialState
  }
  var bundle = {
    name: 'sbot-replication-manager',
    getExtraArgs: function () {
      return {
        request: opts.request,
        getPeerAheadBy: opts.getPeerAheadBy,
        isReplicationLimited: opts.isReplicationLimited
      }
    }
  }

  var createStore = composeBundlesRaw(debugBundle, createReactorBundle(), bundle, peers, scheduler)

  return createStore()
}
