# socket.io rxjs

Build a ReactJS(Next.js) chat app with RxJS and Socket.IO
Please feel free to contact me if you need any further information.

## Start development

Server
```
$ npm install && node ./server.js
```

Client (Next.js)
```
$ npm install && npm run dev
```

## Testing Socket.IO Server

Server
```
$ npm install -g artillery@latest
$ artillery run load-test/simple-test.yaml

```