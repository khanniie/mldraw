/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import * as p5 from 'p5'
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

const make_sketch = (comm: Comm, emit: Emit, component: P5CanvasComponent) => (p: p5) => {
    let prev_x: number = null;
    let prev_y: number = null;
    let renderer;
    let layers: Layer[] = [];
    let layerIdx = 0;
    let currentLayer: Layer;
    let prevTouchTime = -1;

    let appState;

    let draw = true;

    function eraser(b){
      draw = !eraser
    }

    p.setup = function () {
        //p.pixelDensity(1);
        renderer = p.createCanvas(256, 256);
        renderer.id("p5-canvas");

        p.background(255, 255, 255, 0);
        p.fill(0);
        p.stroke(0);
        p.strokeCap('round');
        p.strokeWeight(1);
    }

    p.mouseDragged = function () {
        if (prev_x == null && prev_y == null) {
            prev_x = p.mouseX;
            prev_y = p.mouseY;
            prevTouchTime = p.millis();
        } else {
            if (p.millis() - prevTouchTime < 100) {
                // if(draw){
                //   p.stroke(0)
                //   p.blendMode(p.BLEND)
                // } else {
                //   p.stroke(255, 255, 255, 0)
                //   p.blendMode(p.LIGHTEST)
                // }
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

    function clearCanvas() {

      p.clear();

    }

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    async function executeOp(op: Operation,
        fromGraphics: Graphics | p5.Renderer,
        toGraphics: Graphics) {

        const canvas = fromGraphics.elt as HTMLCanvasElement;
        const canvasData = await toBlob(canvas);
        const reply = await comm.send(op, { canvasData });

        if(reply == undefined) {
            console.error('No reply from server')
            return
        }

        if ('error' in reply) {
            console.error(`Error: ${reply.error}`);
            return reply.error;
        }

        emit('drawoutput', reply.canvasData)

        return toGraphics;

    }

    component.sketch = {
        renderCanvas,
        clearCanvas,
        eraser
    }
}

// functions returned by the p5 sketchs
type SketchMethods = {
    renderCanvas: () => void,
    clear: () => void,
    eraser: (b:boolean) => void
}

export class P5CanvasComponent extends Component {
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
        new (p5 as any).default(make_sketch(this.comm, this.emit, this), element)
    }

    update(state: State) {
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div id="p5-canvas-container"></div>`
    }
}

export function p5CanvasStore(state: State, emitter: Emitter) {
    emitter.on('p5-clear', () => {
        // hacky
        console.log('clearing canvas');
        state.cache(P5CanvasComponent, 'p5-canvas').sketch.clearCanvas()
    })
    emitter.on('p5-eraser', (b :boolean) => {
        // hacky
        state.cache(P5CanvasComponent, 'p5-canvas').sketch.eraser(b)
    })
}
