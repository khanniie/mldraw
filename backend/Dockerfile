FROM nvidia/cuda:9.0-cudnn7-devel

SHELL ["/bin/bash", "-c"]

# install conda

RUN apt-get update --fix-missing && apt-get install -y wget bzip2 ca-certificates \
    libglib2.0-0 libxext6 libsm6 libxrender1 \
    git mercurial subversion

RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda2-4.5.11-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \
    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \
    echo "conda activate base" >> ~/.bashrc && \
    chmod +x ~/.bashrc

ENV PATH /opt/conda/bin:$PATH

RUN conda create -y -n mldraw python=3.6

# install init (tini)

RUN apt-get install -y curl grep sed dpkg tmux vim && \
    TINI_VERSION=`curl https://github.com/krallin/tini/releases/latest | grep -o "/v.*\"" | sed 's:^..\(.*\).$:\1:'` && \
    curl -L "https://github.com/krallin/tini/releases/download/v${TINI_VERSION}/tini_${TINI_VERSION}.deb" > tini.deb && \
    dpkg -i tini.deb && \
    rm tini.deb && \
    apt-get clean

# install python deps things

RUN source ~/.bashrc && \
    source activate mldraw && \
    conda install -y pip && \
    pip install numpy && \
    pip install scipy && \
    pip install scikit-image && \
    pip install aiohttp && \
    pip install python-socketio && \
    pip install websockets && \
    pip install Pillow && \
    pip install tensorflow-gpu==1.12 && \
    pip install opencv-python && \
    conda install -y pytorch torchvision cudatoolkit=9.0 -c pytorch && \
    pip install dominate && \
    pip install visdom && \
    pip install cupy-cuda90 && \
    pip install chainer 


# install mldraw & various backends

RUN git clone --recurse-submodules https://github.com/khanniie/mldraw && \
    cd mldraw/models/pix2pix/pytorch_cyclegan_pix2pix && \
    bash scripts/download_pix2pix_model.sh edges2shoes && \
    bash scripts/download_pix2pix_model.sh facades_label2photo && \
    bash scripts/download_pix2pix_model.sh map2sat && \
    mv checkpoints/edges2shoes_pretrained checkpoints/shoes && \
    mv checkpoints/facades_label2photo_pretrained checkpoints/facades2 && \
    mv checkpoints/map2sat_pretrained checkpoints/satellite

ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD [ "/bin/bash" ]
