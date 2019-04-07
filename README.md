# mldraw~

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
   * In one terminal: `python -m backend.app`, this is the 'registry server'
   * Then launch each of the model servers. For the pix2pix one that's in this repository, `cd models && python -m pix2pix.app --backend-url <URL of registry server> --self-url <URL of this computer>`

# Integrating your own model

One of the main goals of MLDraw is to make it easy to integrate new models

0. Start the backend 'registry' server with `python -m backend.app` from the root of the MLDraw folder. 
1. Install `PIL`, `aiohttp`  and `python-socketio` into your project
2. Copy [backend/mldraw_adaptor.py](backend/mldraw_adaptor.py)
3. Implement the handler function and call `mldraw_adaptor.start`, for instance:
```python
# save as app.py
import argparse
from .mldraw_adaptor import start, canvas_message_handler

# optional but easy
def args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--backend-url', type=str, help='URL of backend server')
    parser.add_argument('--self-url', type=str, help='URL of this computer')
    return parser.parse_args()

# ****
# fill out this part
# ****
@canvas_message_handler('<model-name>')
def handler(img): # img is of type PIL.Image
   # process the image somehow, e.g
   tensor = preprocess(img)
   result = model(tensor)
   # return a PIL.Image
   return convert_to_image(result)

if __name__ == '__main__':
   start(args())
```
4. In a seperate terminal to before, run `python -m project_folder.app --self-url <url of this computer> --backend-url <url of mldraw backend>`. 

   For instance, an example command may be: `python -m project.app --self-url http://localhost:8082 --backend-url http://localhost:8080`.
The values for `--self-url` and `--backend-url` should be externally accessible if you want people to be able to use your model outside of `localhost`.