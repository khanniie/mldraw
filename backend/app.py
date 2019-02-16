# Taken from https://gist.github.com/lambdalisue/05d5654bd1ec04992ad316d50924137c
# Let's you use ctrl-c to interrupt the event loop (and so the server)

import asyncio
import sys

# Ctrl-C (KeyboardInterrupt) does not work well on Windows
# This module solve that issue with wakeup coroutine.
# https://stackoverflow.com/questions/24774980/why-cant-i-catch-sigint-when-asyncio-event-loop-is-running/24775107#24775107
if sys.platform.startswith('win'):
    def hotfix(loop):
        loop.call_soon(_wakeup, loop, 1.0)
        return loop

    def _wakeup(loop, delay=0.5):
        loop.call_later(delay, _wakeup, loop, delay)
else:
    # Do Nothing on non Windows
    def hotfix(loop):
        return loop

hotfix(asyncio.get_event_loop())


from io import BytesIO
from functools import wraps
from inspect import isawaitable
import asyncio
import base64

from aiohttp import web

import socketio
sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

available_handlers = {}

@sio.on('connect')
def connect(sid, environ):
    print("connect ", sid)
    return available_handlers

@sio.on('register')
def register(sid, data):
    addr = data['addr']
    handlers = data['handlers']
    available_handlers[addr] = handlers
    print("discovered new handlers, now available: {}".format(available_handlers))
    sio.emit('available-handlers', available_handlers)

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

def main():
    web.run_app(app, port=8080)

if __name__ == '__main__':
    hotfix(asyncio.get_event_loop())
    print('available handlers:', available_handlers)
    main()
