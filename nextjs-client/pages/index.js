import Head from 'next/head'
import io from 'socket.io-client'
import { useEffect, useState } from 'react'
import { of, fromEvent } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { getUsername } from '../utils/user'
import { emitOnConnect, listenOnConnect } from '../lib/socketLib'

export default function Home() {
  const [socket, setSocket] = useState(null)
  const [users, setUsers] = useState({})
  const [msgs, setMsgs] = useState([])
  const [uid, setUid] = useState('')
  const [msg, setMsg] = useState('')
  const clearUsers = () => {
    setUsers({})
  }
  const addUser = (id, username) => {
    setUsers(users => ({...users, [id]: username}))
  }
  const removeUser = (id) => {
    setUsers(users => {
      return Object.keys(users).reduce((result, key) => {
          if (key !== id) {
              result[key] = users[key];
          }
          return result;
      }, {})
    })
  }
  
  useEffect(() => {
    const socket = io('ws://localhost:4000', {
      transports: ['websocket'],
    })
    const socket$ = of(socket)
    setSocket(socket$)
  }, [])

  useEffect(() => {
    if (socket) {
      const connect$ = socket
        .pipe(
          switchMap(socket =>
            fromEvent(socket, 'connect')
              .pipe(
                map(() => socket)
              )
          )
        )

      listenOnConnect(connect$, 'all_users')
        .subscribe((users) => {
          clearUsers()
          users.map(({ id, username }) => addUser(id, username))
        })

      const username$ = of(getUsername())
      emitOnConnect(connect$, username$)
        .subscribe(({ socket, data }) => {
          const username = data
          socket.emit('save_username', username)
        })

      listenOnConnect(connect$, 'new_user_join')
        .subscribe(({ id, username }) => {
          addUser(id, username)
        })

      listenOnConnect(connect$, 'remove_user')
        .subscribe(id => {
          removeUser(id)
        })
      
        listenOnConnect(connect$, 'chat_message')
          .subscribe(({ from, msg }) => {
            addMessage(from, msg)
          })
    }
  }, [socket, addUser])

  const onChangeUser = (e) => {
    setUid(e.target.value)
  }
  const onChangeMessage = (e) => {
    setMsg(e.target.value)
  }
  const clear = () => {
    setUid('')
    setMsg('')
  }
  const addMessage = (uid, message, isMine=0) => {
    setMsgs(list => ([...list, {id: uid, text: message, t: new Date(), isMine}]))
  }
  const onClickSubmit = () => {
    const sendMessage$ = of(msg)
    const connect$ = socket
    emitOnConnect(connect$, sendMessage$)
      .subscribe(({ socket, data }) => {
        clear()
        addMessage(uid, msg, 1)
        socket.emit('chat_message', { id: uid, msg })
      })
  }

  return (
    <div className="container">
      <Head>
        <title>RxJS with Socket io</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>RxJS with Socket io</h1>
        <div  style={{ width: '80%' }}>
          <h3>Total User Number</h3>
          <div>
            <p>{Object.keys(users).length}</p>
          </div>
        </div>
        <div  style={{ width: '80%' }}>
          <h3>Join User</h3>
          <div>
            {
              Object.keys(users).map(id => (
                <div key={id}>
                  <p>{`id: ${id}`}</p>
                  <p>{`username: ${users[id]}`}</p>
                </div>
              ))
            }
          </div>
        </div>
        <div style={{ width: '80%' }}>
          <h3>Message</h3>
          <div>
            {
              msgs.map(msg => (
                <p style={{ textAlign: msg.isMine ? 'right' : 'left' }} key={msg.t}>
                  {`${msg.text} (${msg.id})`}
                </p>
              ))
            }
          </div>
          <hr />
        </div>
        <div style={{ width: '80%' }}>
          <div>
            Send Message to:
            <input value={uid} onChange={onChangeUser} placeholder="id"></input>
          </div>
          <div>
            Message:
            <input value={msg} onChange={onChangeMessage} placeholder="message"></input>
          </div>
          <div>
            <button onClick={onClickSubmit}>submit message</button>
          </div>
        </div>
      </main>

      <footer>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          width: 100%;
          padding: 1rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
