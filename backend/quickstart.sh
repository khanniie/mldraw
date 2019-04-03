# meant to be run within the docker container
# from https://gist.github.com/todgru/6224848
#
session="mldraw"

# set up tmux
tmux start-server

# create a new tmux session, starting vim from a saved session in the new window
tmux new-session -d -s $session -n bash #"vim -S ~/.vim/sessions/kittybusiness"

# Select pane 1, set dir to api, run vim
tmux selectp -t 1 
tmux send-keys "source activate mldraw" C-m 
tmux send-keys "cd /mldraw" C-m 
tmux send-keys "python -m backend.app" C-m 

# Split pane 1 horizontal by 65%, start redis-server
tmux splitw -h -p 50
tmux send-keys "source activate mldraw" C-m 
tmux send-keys "cd /mldraw/models" C-m 
tmux send-keys "python -m pix2pix.app --self-url http://localhost:8081 --backend-url http://localhost:8080" C-m 

# Finished setup, attach to the tmux session!
tmux attach-session -t $session
