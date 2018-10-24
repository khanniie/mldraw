from io import BytesIO
from functools import wraps
from aiohttp import web
from PIL import Image
from PIL import ImageOps

import socketio

sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

def canvas_message_valid(data):
    return 'canvasData' in data

def canvas_message_handler(message: str):
    ''' Bind the following function to be a handler for socket.io `message`
    to be called with a PIL image representing the canvas.

    The handler should return the new bytes of the resulting image.
    The result image is required to be the same size at the input image.
    e.g:
    ```python
        @canvas_message_handler('process-image')
        def process_image(img):
            result = process(img)
            return result.tobytes()```
    '''

    def decorator(handler):

        @sio.on(message) #bind it to the socketio message
        @wraps(handler) #better error messages
        async def canvas_handler(sid, data):
            print(f'recieved {message} request')
            if canvas_message_valid(data):
                blob = BytesIO(data['canvasData'])
                img = Image.open(blob)
                newBytes = await handler(img)
                print(f'executed {message} request')
                return {'canvasData': newBytes}
            else:
                print(f'rejected {message} request')
                return {'error': 'canvas message invalid'}

    return decorator

@canvas_message_handler('flip-canvas')
def flip_canvas(img):
    flipped = ImageOps.flip(img)
    return flipped.tobytes()

@sio.on('connect')
def connect(sid, environ):
    print("connect ", sid)

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

def main():
    web.run_app(app)

if __name__ == '__main__':
    main()