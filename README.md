# ssb-replication-limiter

> Limit and prioritise ebt replication for ssb.

[ssb-ebt](https://github.com/ssbc/ssb-ebt) only exposes an api to stop or start replication of a feed. This module enhances it so you can control the maximum number of simultaneous downloads and prioritise who gets replicated first. 

The limiter has two modes: unlimited and limited. In unlimited mode the module doesn't really do anything, it's just ordinary ebt replication.

In limited mode, only a certain number of feeds are allowed to be replicating at once.

This module tracks how far behind all feeds are. If your local copies are a long way behind then you have to do a lot of downloading to do. If a feed is more than threshold (`modeChangeThreshold`) behind, the module changes mode to `limited` mode.

In limited mode, only a set number (`maxNumConnections`) of feeds will be replicated simultaneously.

It's also possible to prioritise which feeds are replicated first in limited mode. See the third argument of the `request` function.

## API


### Init

```js
var ReplicationLimiter = require('ssb-replication-limiter')
var replicationLimiter = ReplicationLimiter(opts)
```
Takes an `opts` object of shape: 

```
{
  peerStatus: <function> (required)
  request: <function> (required)

  maxNumConnections: <num>,
  modeChangeThreshold: <num>,
}
```

`replicationLimiter` has four methods:

###  replicationLimiter.request(feedId, isReplicationEnabled, [priority])

Same as ssb-ebt's request method. `priority` is optional and defaults to 0. The higer the number, the sooner it will be replicated.

### replicationLimiter.setModeChangeThreshold(threshold)

Sets a new mode change threshold.

### replicationLimiter.setMaxNumConnections(max)

Sets a new maximum number of connections allowed when in limited mode.

### replicationLimiter.isReplicationEnabled(<listener-function>)

`isReplicationEnabled` is an [observable](https://github.com/dominictarr/obv)

Sets `listener-function` as a new observer of `isReplicationEnabled` 

`listener-function` will be called with a boolean when the mode changes.
 
## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ssb-replication-limiter
```

## Acknowledgments

This project is funded by a grant from [staltz](https://github.com/staltz) for the [manyverse](https://github.com/staltz/manyverse) project.

## See Also

- [`ssb-ebt`](https://github.com/ssbc/ssb-ebt)

## License

MIT
