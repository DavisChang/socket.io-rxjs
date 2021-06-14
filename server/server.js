const { of, fromEvent, zip, from, timer } = require('rxjs')
const { map, switchMap, mergeMap, takeUntil } = require('rxjs/operators')
const app = require('express')();
const server = require('http').createServer(app);

const options = {};
const io = require('socket.io')(server, options);


const io$ = of(io)
const connection$ = io$
  .pipe(
    switchMap(io =>
      fromEvent(io, 'connection')
        .pipe(
          map(client => ({ io, client }))
        )
    )
  )
const disconnect$ = connection$
  .pipe(
    mergeMap(({ client }) =>
      fromEvent(client, 'disconnect')
        .pipe(
          map(() => client)
        )
    )
  )

const listenOnConnect = (event) => {
  return connection$
    .pipe(
      mergeMap(({ io, client }) =>
        fromEvent(client, event)
          .pipe(
            takeUntil(
              fromEvent(client, 'disconnect')
            ),
            map(data => ({ io, client, data }))
          )
      )
    )
}

connection$.subscribe(({ client }) => {
  console.log('connected: ', client.id)
})

disconnect$.subscribe(client => {
  console.log('disconnected: ', client.id)
})

// receive 'message'
listenOnConnect('message')
  .subscribe(({ io, client, data }) => {
    console.log('==============')
    console.log('[message] from ', client.id)
    console.log('data:', data)

    if (data === 'loop_events') {
      zip(
      from([1,2,3,4,5]),
        timer(0, 1000),
        (val, i) => val // Just emit the value
      ).subscribe(val => client.emit('loop', val))
    }
    console.log('==============')
  })

// receive event 'loop_events'
const loop_events = 'loop_events'
listenOnConnect(loop_events)
  .subscribe(({ io, client, data }) => {
    console.log('==============')
    console.log(`[${loop_events}] from ${client.id}`)
    console.log('data:', data)

    if (typeof data === 'number') {
      zip(
      from(Array.from(Array(data).keys())),
        timer(0, 1000),
        (val, i) => val
      ).subscribe(val => client.emit('loop', val))
    }
    console.log('==============')
  })

server.listen(4000, () => {
  console.log('listening on *:4000');
});


