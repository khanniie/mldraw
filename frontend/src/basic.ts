import "babel-polyfill"
import * as p5 from 'p5'
import { Comm, toBlob, Operation } from './comm'

// the type definition for p5.Graphics is wrong so
// we have to make our own
type Graphics = p5 & p5.Element
type Layer = Graphics;

async function make_sketch(p: p5) {
    let prev_x: number = null;
    let prev_y: number = null;
    let renderer: p5.Renderer;
    let layers: Layer[] = [];
    let layerIdx = 0;
    let currentLayer: Layer;

    const comm = new Comm();
    await comm.connect('localhost:8080');

    const makeLayer = (w: number, h: number): Layer => {
        const gfx = p.createGraphics(w, h) as any as Graphics;
        gfx.background(0, 0, 0, 0);
        return gfx;
    }

    p.setup = function() {
        renderer = p.createCanvas(200, 200);
        
        layers.push(makeLayer(p.width, p.height));

        p.background(0);
        p.fill(255);
        p.stroke(255);
        p.strokeCap('round');
        p.strokeWeight(5);
    }

    p.draw = function() { 
        for(const layer of layers) p.image(layer, 0, 0);
    }

    p.mouseDragged = function() {
        if(prev_x == null && prev_y == null){
            prev_x = p.mouseX;
            prev_y = p.mouseY;
        } else {
            p.line(prev_x, prev_y, p.mouseX, p.mouseY);
            prev_x = p.mouseX;
            prev_y = p.mouseY;
        }
    }

    p.keyPressed = async function() {
        console.log("flip-canvas requested");
        await executeOp(Operation.flip_canvas, 
                        renderer, // normally this would be layer[some idx]
                        layers[0]);
        console.log("flip-canvas executed");
    }

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    async function executeOp(op: Operation, 
                             fromGraphics: Graphics | p5.Renderer, 
                             toGraphics: Graphics) {

        const canvas = fromGraphics.elt as HTMLCanvasElement;
        const canvasData = await toBlob(canvas);
        const reply = await comm.send(op, { canvasData });
        const flippedByes = new Uint8Array(reply.canvasData);

        toGraphics.loadPixels(); // required even though we don't read from pixels
        const len = toGraphics.pixels.length;
        const pixels = toGraphics.pixels;

        // annoying that this copy is needed
        for(let i = 0; i < len; i++) pixels[i] = flippedByes[i];
        toGraphics.updatePixels();
        return toGraphics;

    }
}

const container = document.querySelector("#container") as HTMLElement;
const sketch = new (p5 as any).default(make_sketch, container); // the typings are a little outdated :(