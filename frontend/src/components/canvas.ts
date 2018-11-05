/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import * as p5 from 'p5'
import { Comm, toBlob, Operation } from '../comm'
import { doNothingIfRunning } from '../util'

// the type definition for p5.Graphics is wrong so
// we have to make our own
type Graphics = p5 & p5.Element
type Layer = Graphics;

// in its own function so it can be JIT compiled for performance
function copy<T>(fromArr: ArrayLike<T>, toArr: Array<T>) {
    const len = toArr.length;
    for (let i = 0; i < len; i++) toArr[i] = fromArr[i];
}

const make_sketch = (comm: Comm, emit: Emit, component: CanvasComponent) => (p: p5) => {
    let prev_x: number = null;
    let prev_y: number = null;
    let renderer: p5.Renderer;
    let layers: Layer[] = [];
    let layerIdx = 0;
    let currentLayer: Layer;
    let prevTouchTime = -1

    let appState

    const makeLayer = (w: number, h: number): Layer => {
        const gfx = p.createGraphics(w, h) as any as Graphics;
        gfx.background(0, 0, 0, 0);
        return gfx;
    }

    p.setup = function () {
        p.pixelDensity(1);
        renderer = p.createCanvas(256, 256);

        layers.push(makeLayer(p.width, p.height));

        p.background(255);
        p.fill(0);
        p.stroke(0);
        p.strokeCap('round');
        p.strokeWeight(1);
    }

    p.draw = function () {
        for (const layer of layers) p.image(layer, 0, 0);
    }

    p.mouseDragged = function () {
        if (prev_x == null && prev_y == null) {
            prev_x = p.mouseX;
            prev_y = p.mouseY;
            prevTouchTime = p.millis();
        } else {
            if (p.millis() - prevTouchTime < 100) {
                p.line(prev_x, prev_y, p.mouseX, p.mouseY);
            }
            prev_x = p.mouseX;
            prev_y = p.mouseY;
            prevTouchTime = p.millis();
        }
    }

    const renderCanvas = doNothingIfRunning(async function () {
        console.log("edges2shoes requested");
        await executeOp(Operation.edges2shoes_pretrained,
            renderer, // normally this would be layer[some idx]
            layers[0]);
        console.log("edges2shoes executed");
    })

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    async function executeOp(op: Operation,
        fromGraphics: Graphics | p5.Renderer,
        toGraphics: Graphics) {

        const canvas = fromGraphics.elt as HTMLCanvasElement;
        const canvasData = await toBlob(canvas);
        const reply = await comm.send(op, { canvasData });

        if ('error' in reply) {
            console.error(`Error: ${reply.error}`);
            return reply.error;
        }

        const flippedByes = new Uint8Array(reply.canvasData);
        toGraphics.loadPixels(); // required even though we don't read from pixels
        // annoying that this copy is needed
        copy(flippedByes, toGraphics.pixels);
        toGraphics.updatePixels();

        return toGraphics;

    }

    component.sketch = {
        renderCanvas
    }
}

// functions returned by the p5 sketchs
type SketchMethods = {
    renderCanvas: () => void
}

export class CanvasComponent extends Component {
    comm: Comm;
    emit: Emit;
    appState: AppState;
    sketch: SketchMethods
    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app;
        this.emit = emit;
    }

    async load(element) {
        //element.innerText = 'Trying to connect to backend...'
        this.comm = new Comm()
        await this.comm.connect(this.appState.server.address)
        new (p5 as any).default(make_sketch(this.comm, this.emit, this), element)
    }

    update(state: State) {
        if (state.app.server.address !== this.appState.server.address) {
            this.appState = state.app;
            this.comm.connect(state.app.server.address)
        }
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div></div>`
    }
}

export function canvasStore(state: State, emitter: Emitter) {
    emitter.on('setURL', url => {
        state.app.server.address = url;
        emitter.emit('render')
    })
    emitter.on('mlrender', () => {
        // hacky
        console.log(state.cache(CanvasComponent, 'p5-canvas'))
        state.cache(CanvasComponent, 'p5-canvas').sketch.renderCanvas()
    })
}
