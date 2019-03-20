# mldraw

heh

lol :)

# Development
Backend requires (all `pip install`able):
* Pillow
* aiohttp
* python-socketio

For the pix2pix models:
* [pytorch & torchvision](https://pytorch.org/get-started/locally/)

Frontend requires:
* `cd frontend && yarn`

To start the development servers:
* For the frontend: `cd frontend && yarn dev`
* For the backend: 
    * In one terminal: `python -m backend.app`
          * This is the 'registry server'
    * Then launch each of the model servers:
          * E.g the pix2pix one: `cd models && python -m pix2pix.app --backend-url <URL of registry server> --self-url <URL of this computer>`
