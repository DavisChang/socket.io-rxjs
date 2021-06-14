import Head from 'next/head'
import io from 'socket.io-client'
import { useEffect, useState } from 'react'
import { of, fromEvent } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { getUsername } from '../utils/user'
import { emitOnConnect, listenOnConnect } from '../lib/socketLib'

// https://steveholgado.com/rxjs-chat-app/
export default function Home() {
  const [socket, setSocket] = useState(null)
  const [users, setUsers] = useState({})
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
    console.log('useEffect users:', users)
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
          console.log('all_users', users)
          clearUsers()
          users.map(({ id, username }) => addUser(id, username))
        })

      const username$ = of(getUsername())
      emitOnConnect(connect$, username$)
        .subscribe(({ socket, data }) => {
          const username = data
          console.log('save_username', username)
          socket.emit('save_username', username)
        })

      listenOnConnect(connect$, 'new_user_join')
        .subscribe(({ id, username }) => {
          console.log('new_user_join', { id, username })
          console.log('users:', users)
          addUser(id, username)
        })

      listenOnConnect(connect$, 'remove_user')
        .subscribe(id => {
          removeUser(id)
        })
    }
  }, [socket, addUser])


  console.log('users:', users)
  return (
    <div className="container">
      <Head>
        <title>RxJS with Socket io</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">RxJS with Socket io</h1>
        <div>
          <h3>Total User Number</h3>
          <div>
            <p>{Object.keys(users).length}</p>
          </div>
        </div>
        <div>
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
        <div>
          <h3>Message</h3>
          <div>
            <p>.....</p>
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
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
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
