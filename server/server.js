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

connection$.subscribe(({ io, client }) => {
  console.log('connected: ', client.id)

  const allSockets = io.sockets.sockets
  const allUsers = Object.entries(allSockets)
      .map(([ id, socket ]) => ({ id, username: socket.username }))
      .filter(({ username }) => username)
  console.log('allUsers: ', allUsers)
  client.emit('all_users', allUsers)
})

disconnect$.subscribe(client => {
  console.log('disconnected: ', client.id)
  client.broadcast.emit('remove_user', client.id)
})

// listen 'save_username' event
listenOnConnect('save_username')
  .subscribe(({ io, client, data }) => {
    console.log('==============')
    console.log('[save_username] from ', client.id)
    console.log('data:', data)
    
    const allSockets = io.sockets.sockets
    const id = client.id
    const username = data
    allSockets[id].username = username
    console.log('[new_user_join] from ', client.id)
    client.broadcast.emit('new_user_join', { id, username })
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


