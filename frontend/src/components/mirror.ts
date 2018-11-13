/**
 * In this file we wrap the ml backend output in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import * as p5 from 'p5'

// the type definition for p5.Graphics is wrong so
// we have to make our own
type Graphics = p5 & p5.Element
type Layer = Graphics;

// in its own function so it can be JIT compiled for performance
function copy<T>(fromArr: ArrayLike<T>, toArr: Array<T>) {
    const len = toArr.length;
    for (let i = 0; i < len; i++) toArr[i] = fromArr[i];
}

const make_mirror = (emit: Emit, component: MirrorComponent) => (p: p5) => {
    let renderer: p5.Renderer;
    let gfx: Layer; //just one layer... should we just render the image on the canvas without graphics?
    let appState;

    p.setup = function () {
        p.pixelDensity(1);
        renderer = p.createCanvas(256, 256);
        gfx = p.createGraphics(p.width, p.height) as any as Graphics;
        gfx.background(0, 0, 0, 0);
        p.background(255);
    }

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    function drawOutput(bytes) {

        const flippedByes = new Uint8Array(bytes);
        gfx.loadPixels(); // required even though we don't read from pixels
        // annoying that this copy is needed
        copy(flippedByes, gfx.pixels);
        gfx.updatePixels();
        p.image(gfx, 0, 0);
        return;
    }

    function clear() {
        gfx.clear();
        p.background(255);
    }

    component.sketch = {
        drawOutput,
        clear
    }
}

// functions returned by the p5 sketchs
type SketchMethods = {
    drawOutput: (bytes:ArrayBuffer) => void,
    clear: () => void
}

export class MirrorComponent extends Component {
    emit: Emit;
    appState: AppState;
    sketch: SketchMethods;
    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app;
        this.emit = emit;
    }

    async load(element) {
        new (p5 as any).default(make_mirror(this.emit, this), element)
    }

    createElement() {
        return html`<div></div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('drawoutput', (bytes:ArrayBuffer) => {
        // hacky
        console.log(state.cache(MirrorComponent, 'p5-mirror'))
        state.cache(MirrorComponent, 'p5-mirror').sketch.drawOutput(bytes)
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing mirror');
        state.cache(MirrorComponent, 'p5-mirror').sketch.clear()
    })
}
