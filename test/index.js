var test = require('tape')
var Store = require('../lib/store')
var { PeerRecord } = require('../lib/peers/')
var {Map} = require('immutable')

function request () {

}

function getPeerAheadBy () {

}

test('simple', function (t) {
  var app = Store({request, getPeerAheadBy})
  t.ok(app, 'app is a thing')
  t.end()
})

test('throws if request not passed in opts', function (t) {
  t.throws(() => Store({}), 'throws')
  t.end()
})

test('Set Max Peers', function (t) {
  var app = Store({request, getPeerAheadBy})
  var expected = 5
  app.doSetMaxNumConnections(expected)

  var newState = app.selectMaxConnectedPeers(app.getState())
  t.equal(newState, expected, 'Peers rtc max is set')
  t.end()
})

test('Adds a peer', function (t) {
  var expectedPriority = 10
  var app = Store({request, getPeerAheadBy})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  app.doAddPeer({feedId: peerId, priority: expectedPriority})
  var peer = app.selectPeers(app.getState()).get(peerId)
  t.ok(peer, 'peer was added')
  t.equal(peer.priority, expectedPriority)

  t.end()
})

test('remove peer', function (t) {
  var app = Store({request, getPeerAheadBy})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  app.doAddPeer({feedId: peerId})
  var peer = app.selectPeers(app.getState()).get(peerId)
  t.ok(peer, 'peer was added')

  app.doRemovePeer({feedId: peerId})
  peer = app.selectPeers(app.getState()).get(peerId)
  t.false(peer)

  t.end()
})

test('scheduler makes connections when started and calls getPeerAheadBy', function (t) {
  t.plan(1)
  function getPeerAheadBy (peerId) {
    t.equal(peerId, peerId)
    app.doStopScheduler()
  }
  var app = Store({request, getPeerAheadBy})
  var peerId = 'DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ='
  app.doAddPeer({feedId: peerId})
  app.doStartScheduler(100)
})

test('selectPeersToStartReplicating', function (t) {
  var id1 = createId(1)
  var id2 = createId(2)
  var id3 = createId(3)
  var id4 = createId(4)

  var threshold = 5
  var peer1 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer2 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer3 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  // if they're already replicating then ignore.
  var peer4 = PeerRecord({
    isReplicating: true,
    aheadBy: threshold + 1
  })

  var state = Map({
    [id1]: peer1,
    [id2]: peer2,
    [id3]: peer3,
    [id4]: peer4
  })

  var maxNumConnections = 3
  var app = Store({request, getPeerAheadBy, peers: {initialState: state}})
  app.doSetModeChangeThreshold(threshold)
  app.doSetMaxNumConnections(maxNumConnections)
  var orderedKeys = app.selectPeersToStartReplicating(app.getState()).keySeq()
  t.equal(orderedKeys.get(0), id3) // these are swapped because we sort and then reverse
  t.equal(orderedKeys.get(1), id2)
  t.equal(orderedKeys.size, maxNumConnections - 1) // peer4 is already replicating
  t.end()
})

test('selectPeersToStartReplicating sorts by priority number', function (t) {
  var id1 = createId(1)
  var id2 = createId(2)
  var id3 = createId(3)

  var threshold = 5
  var peer1 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer2 = PeerRecord({
    isReplicating: false,
    priority: 10,
    aheadBy: threshold + 1
  })

  var peer3 = PeerRecord({
    isReplicating: false,
    priority: 9,
    aheadBy: threshold + 1
  })

  var state = Map({
    [id1]: peer1,
    [id2]: peer2,
    [id3]: peer3
  })

  var maxNumConnections = 3
  var app = Store({request, getPeerAheadBy, peers: {initialState: state}})
  app.doSetModeChangeThreshold(threshold)
  app.doSetMaxNumConnections(maxNumConnections)
  var orderedKeys = app.selectPeersToStartReplicating(app.getState()).keySeq()
  t.equal(orderedKeys.get(0), id2)
  t.equal(orderedKeys.get(1), id3)
  t.equal(orderedKeys.get(2), id1)
  t.equal(orderedKeys.size, maxNumConnections)
  t.end()
})

test('selectPeersToStopReplicating', function (t) {
  var id1 = createId(1)
  var id2 = createId(2)
  var id3 = createId(3)
  var id4 = createId(4)

  var threshold = 5
  var peer1 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer2 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer3 = PeerRecord({
    isReplicating: false,
    aheadBy: threshold + 1
  })

  var peer4 = PeerRecord({
    isReplicating: true,
    aheadBy: threshold - 1
  })

  var state = Map({
    [id1]: peer1,
    [id2]: peer2,
    [id3]: peer3,
    [id4]: peer4
  })

  var app = Store({request, getPeerAheadBy, peers: {initialState: state}})
  app.doSetModeChangeThreshold(threshold)
  app.doSetMaxNumConnections(2)
  var orderedKeys = app.selectPeersToStopReplicating(app.getState()).keySeq()
  t.equal(orderedKeys.get(0), id4)
  t.equal(orderedKeys.size, 1)
  t.end()
})

function createId (num) {
  var peerId = `${num}TNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ=`
  return peerId
}
