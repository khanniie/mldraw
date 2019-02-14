from .mldraw_adaptor import start
from .wrapper import exported_models
import argparse

def args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--backend-url', type=str, help='URL of backend server')
    parser.add_argument('--self-url', type=str, help='URL of this computer')
    return parser.parse_args()

if __name__ == '__main__':

    opts = args()
    start(opts.self_url, opts.backend_url)