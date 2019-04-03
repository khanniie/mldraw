import contextlib
from glob import glob

from PIL import Image

exported_models = {}

class dict2obj(object):

    def __init__(self, d: dict):
        self.__dict__.update(d)

    def __setattr__(self, key, val):
        self.__dict__[key] = val

@contextlib.contextmanager
def remember_cwd():
    curdir = os.getcwd()
    try:
        yield
    finally:
        os.chdir(curdir)

try:
    import numpy as np
    import torch
    from torchvision import transforms
    import torchvision.transforms.functional as F

    import sys
    import os
    SCRIPT_PATH = os.path.dirname(os.path.realpath(__file__))
    PIX2PIX_PATH = os.path.join(SCRIPT_PATH, "pytorch_cyclegan_pix2pix/")
    sys.path.append(PIX2PIX_PATH)

    from .pytorch_cyclegan_pix2pix.test import TestOptions, create_model
    from .pytorch_cyclegan_pix2pix.data.base_dataset import get_transform

    PIX2PIX_CHECKPOINTS_PATH = os.path.join(PIX2PIX_PATH, 'checkpoints')

    pix2pix_checkpoints = glob(PIX2PIX_CHECKPOINTS_PATH + os.sep + "*")
    pix2pix_checkpoints = [os.path.basename(chkpt) for chkpt in pix2pix_checkpoints]
    print("Discovered Pix2Pix checkpoints: " + str(pix2pix_checkpoints))

    PIX2PIX_DEFAULT_OPTS = {
        "dataroot": "n/a",
        "batch_size": 1,
        "loadSize": 256,
        "fineSize": 256,
        "input_nc": 3,
        "output_nc": 3,
        "ngf": 64,
        "ndf": 64,
        "netD": "basic",
        "netG": "unet_256",
        "n_layers_D": 3,
        "gpu_ids": [0],
        "name": "to be overriden",
        "dataset_mode": "aligned",
        "model": "pix2pix",
        "direction": "BtoA",
        "epoch": "latest",
        "num_threads": 4,
        "checkpoints_dir": "./checkpoints",
        "norm": "batch",
        "serial_batches": True,
        "no_dropout": True,
        "max_dataset_size": float("inf"),
        "resize_or_crop": "none",
        "no_flip": True,
        "init_type": "normal",
        "init_gain": 0.02,
        "verbose": True,
        "suffix": "",
        "phase": "test",
        "ntest": float("+inf"),
        "num_test": float("+inf"),
        "aspect_ratio": 1.0,
        "results_dir": "./results/",
        "eval": True,
        "display_id": -1,
        "isTrain": False,
        "model_suffix": '',
        "pool_size": 0,
        "no_lsgan": True,
        "lambda_L1": 100,
        "verbose": False
    }

    def img2tensor(img, device):
        ''' convert a 4-channel PIL Image to a torch.FloatTensor
        normalised to [-1, 1]
        '''
        img_arr = np.asarray(img)
        img_arr, alpha = img_arr[:, :, :3], img_arr[:, :, 3]
        img_arr = np.transpose(img_arr, (2, 0, 1)) #HWC -> CHW
        img_tensor = torch.from_numpy(img_arr)
        img_tensor = img_tensor.to(device)
        img_tensor = (img_tensor.float() / 255.0) * 2 - 1
        return img_tensor, alpha

    class Pix2PixWrapper(object):

        def __init__(self, opts=None):
            opts = {} if opts is None else opts
            merged = dict2obj({**PIX2PIX_DEFAULT_OPTS,
                               **opts})
            self.opts = merged
            if len(merged.gpu_ids) > 0:
                torch.cuda.set_device(merged.gpu_ids[0])
            with torch.no_grad():
                self.model = create_model(merged)
                self.model.setup(merged)
                if merged.eval:
                    self.model.eval()

        def infer(self, img: Image):
            #img.save("input.png")
            with torch.no_grad():
                tensor_rgb, alpha = img2tensor(img, self.model.device)
                tensor_input = tensor_rgb.unsqueeze(0)
                result = self.model.netG(tensor_input).squeeze().cpu()
                alpha = np.expand_dims(alpha, 0)
                r = ((result * 0.5 + 0.5).numpy() * 255).astype(np.uint8)
                r = np.concatenate((r, alpha), axis=0)
                r = np.transpose(r, (1, 2, 0))
            output_img = Image.fromarray(r)
            #output_img.save("output.png")
            return output_img

        def __call__(self, img):
            return self.infer(img)

    for checkpoint in pix2pix_checkpoints:
        with remember_cwd():
            os.chdir(PIX2PIX_PATH)
            model = Pix2PixWrapper({"name": checkpoint})

        exported_models[checkpoint] = model

    sys.path.remove(PIX2PIX_PATH)

    


except ImportError as exn:
    raise Exception(f"""Got ${exn} when trying to instantiate pix2pix wrapper. 
    
    This might be caused by PyTorch not being installed, or the pytorch_cyclegan_pix2pix submodule not being cloned.
    Try running:
        
        $ git submodule update --init --recursive 
        $ cd modles/pix2pix/pytorch_cyclegan_pix2pix && pip install -r requirements.txt

    In the root of this project""")
