import os
from importlib import import_module
from glob import glob

from .pix2pix.wrapper import exported_models as pix2pix_models


all_exported_models = {
    **pix2pix_models
}


# TODO: fix this automatic importing stuff
"""

SCRIPT_PATH = os.path.dirname(os.path.realpath(__file__))

MODEL_WRAPPER_GLOB = os.path.join(SCRIPT_PATH, "*/wrapper.py")

discovered_wrappers = glob(MODEL_WRAPPER_GLOB)
discovered_wrappers = [wrapper[len(SCRIPT_PATH):] for wrapper in discovered_wrappers]

for wrapper in discovered_wrappers:
    wrapper_path, ext = os.path.splitext(wrapper)
    wrapper_modulename = wrapper_path.replace(os.sep, ".")
    ret = import_module(wrapper_modulename, package="backend.models")
    print(ret)

"""