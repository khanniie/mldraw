#henlo

## How to add new models

To add the pix2pix models to the backend, I did the following:

1. Make a new folder under models named `pix2pix`
2. Add the github repository of the implementation as a submodule
3. Create a [`wrapper.py`](models/pix2pix/wrapper.py) that has a dictionary named `exported_models`. This dictionary is a map from message names to image processing functions that the backend will call when that message name is recieved.
4. Modify [`autoimport_models.py`](models/autoimport_models.py) to import the exported dictionary and add it to the global dictionary of handlers
    * The [`app.py`](app.py) will then automatically create and bind handlers for these message names.

Note that this approach didn't require modifying the original implementation's code, which makes it easy to install (or not install) the implementation of pix2pix if someone didn't want to use it.  However, this might not be possible for some models.