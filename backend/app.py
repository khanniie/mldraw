from io import BytesIO

from aiohttp import web
from PIL import Image
from PIL import ImageOps

import socketio

sio = socketio.AsyncServer()
app = web.Application()
sio.attach(app)

def deserialise_canvas(canvas):
    raise NotImplementedError()

@sio.on('connect')
def connect(sid, environ):
    print("connect ", sid)

@sio.on('flip-canvas')
async def message(sid, data):
    print("recieved flip-canvas request")
    blob = BytesIO(data['canvasData'])
    img = Image.open(blob)
    img = ImageOps.flip(img)
    newBytes = img.tobytes()
    print("executed flip-canvas request")
    return {"canvasData": newBytes}

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

def main():
    web.run_app(app)

if __name__ == '__main__':
    main()