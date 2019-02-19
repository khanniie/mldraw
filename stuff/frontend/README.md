# Frontend

This is the drawing frontend to the `mldraw` application.

Currently, you can draw on the canvas. 
Pressing any key will cause the canvas to be flipped, but using the backend.

To specify a custom location of the backend server, set it as the `server` parameter in the url, e.g if your frontend is hosted on `localhost:1234` and your backend is on `my-backend.com:1000`, connect to `localhost:1234/?server=my-backend.com:1000`.

# Development

Run `yarn dev` to start the development server.