# Taken from https://gist.github.com/lambdalisue/05d5654bd1ec04992ad316d50924137c
# Let's you use ctrl-c to interrupt the event loop (and so the server)

import asyncio
import sys
import re

URL_RE = '(?:http.*://)?(?P<host>[^:/ ]+).?(?P<port>[0-9]*).*'


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
from PIL import Image, ImageOps

import socketio

sio = socketio.AsyncServer(cors_allowed_origins=['mldraw.com','mldraw.com:1234', '34.67.243.62:1234'])
app = web.Application()
sio.attach(app)

available_handlers = {}

routes = web.RouteTableDef()

@routes.get('/')
async def get_handler(request):
  return web.Response(text='test test test\n')

def canvas_message_valid(data):
    return 'canvasData' in data or 'imageData' in data

def canvas_message_handler(message: str):
    ''' Bind the following function to be a handler for socket.io `message`
    to be called with a PIL image representing the canvas.

    The handler should return the new bytes of the resulting image.
    The result image is required to be the same size at the input image.
    The handler is allowed to be an async function as long as it returns an awaitable.
    e.g: 
    ```python
        @canvas_message_handler('process-image')
        def process_image(img):
            result = process(img)
            return result.tobytes()```
    '''

    def decorator(handler):

        @sio.on(message) # bind it to the socketio message
        @wraps(handler) # better error messages
        async def canvas_handler(sid, data):
            print(f'recieved {message} request')
            if canvas_message_valid(data):
                if 'canvasData' in data:
                    blob = BytesIO(data['canvasData'])
                    img = Image.open(blob)
                else:
                    imageData = data['imageData']
                    img = Image.frombuffer('RGBA', (imageData['width'], imageData['height']), imageData['data'])
                output_img = handler(img)
                if isawaitable(output_img): # handler was async
                    output_img = await output_img 
                output_buf = BytesIO()
                output_img.save(output_buf, format="PNG")
                base64_img = base64.b64encode(output_buf.getvalue()).decode('utf-8')
                print(f'executed {message} request')
                return {'canvasData': base64_img}
            else:
                print(f'rejected {message} request')
                return {'error': 'canvas message invalid'}
        
        global available_handlers
        available_handlers[message] = handler

        return canvas_handler

    return decorator

@sio.on('list-available-handlers')
def get_available_handlers():
    return list(available_handlers.keys())

async def register(self_url, server_url):
    print("registering to {}".format(server_url))
    client = socketio.AsyncClient()
    await client.connect(server_url)
    await client.emit('register', {'addr': self_url, 'handlers': list(available_handlers.keys())})
    print("registered with {}".format(server_url))
    
app.add_routes(routes)

def start(opts):
    print("available handlers: {}".format(available_handlers.keys()))
    sio.start_background_task(register, opts.self_url, opts.backend_url)
    groups = re.search(URL_RE, opts.self_url)
    if groups.group('port') != '':
        port = int(groups.group('port'), base=10)
    else:
        port = 8081
    web.run_app(app, port=port)

