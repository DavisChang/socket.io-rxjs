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
  const allSockets = io.sockets.sockets
  const allUsers = Object.entries(allSockets)
      .map(([ id, socket ]) => ({ id, username: socket.username }))
      .filter(({ username }) => username)
  client.emit('all_users', allUsers)
})

disconnect$.subscribe(client => {
  client.broadcast.emit('remove_user', client.id)
})

// listen 'save_username' event
listenOnConnect('save_username')
  .subscribe(({ io, client, data }) => {
    const allSockets = io.sockets.sockets
    const id = client.id
    const username = data
    allSockets[id].username = username
    client.broadcast.emit('new_user_join', { id, username })
  })

// receive event 'loop_events'
const loop_events = 'loop_events'
listenOnConnect(loop_events)
  .subscribe(({ io, client, data }) => {
    if (typeof data === 'number') {
      zip(
      from(Array.from(Array(data).keys())),
        timer(0, 1000),
        (val, i) => val
      ).subscribe(val => client.emit('loop', val))
    }
  })

  // receive event 'chat_message'
const chat_message = 'chat_message'
listenOnConnect(chat_message)
  .subscribe(({ io, client, data }) => {
    const from = client.username
    const { id, msg } = data

    if (!id) return

    if (id === 'everyone') {
      // Send to everyone
      client.broadcast.emit('chat_message', { from, msg, id })
    } else {
      // Send only to recipient
      client.broadcast.to(id).emit('chat_message', { from, msg, id })
    }
  })


server.listen(4000, () => {
  console.log('listening on *:4000');
});


