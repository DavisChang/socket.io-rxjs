import { pipe, map, switchMap } from 'rxjs/operators'
import { of, fromEvent } from 'rxjs'

export function listenOnConnect(connect$, event) {
  return connect$
    .pipe(
      switchMap(socket =>
        fromEvent(socket, event)
      )
    )
}

export function emitOnConnect(connect$, observable$) {
  return connect$
    .pipe(
      switchMap(socket =>
        observable$
          .pipe(
            map(data => ({ socket, data }))
          )
      )
    )
}

