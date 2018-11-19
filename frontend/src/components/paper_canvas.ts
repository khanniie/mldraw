/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import * as paper from 'paper'
import { Comm, toBlob, Operation } from '../comm'
import { doNothingIfRunning } from '../util'

// the type definition for p5.Graphics is wrong so
// we have to make our own
// type Graphics = p5 & p5.Element
// type Layer = Graphics;

// in its own function so it can be JIT compiled for performance

const make_sketch = (comm: Comm, emit: Emit, component: PaperCanvasComponent) => (p: paper) => {
    //let layers: Layer[] = [];
    //let layerIdx = 0;
    //let currentLayer: Layer;
    //let prevTouchTime = -1
    // const makeLayer = (w: number, h: number): Layer => {
    //     const gfx = p.createGraphics(w, h) as any as Graphics;
    //     gfx.background(0, 0, 0, 0);
    //     return gfx;
    // }

    let appState;
    let path;

    p.onMouseDown = function(event) {
    	// If we produced a path before, deselect it:
    	if (path) {
    		path.selected = false;
    	}

    	// Create a new path and set its stroke color to black:
    	path = new p.Path({
    		segments: [event.point],
    		strokeColor: 'black',
    		// Select the path, so we can see its segment points:
    		fullySelected: true
    	});
    }
    // While the user drags the mouse, points are added to the path
    // at the position of the mouse:
    p.onMouseDrag = function(event) {
    	path.add(event.point);
    }

    // When the mouse is released, we simplify the path:
    p.onMouseUp = function(event){
    	var segmentCount = path.segments.length;

    	// When the mouse is released, simplify it:
    	path.simplify(10);

    	// Select the path, so we can see its segments:
    	path.fullySelected = true;

    	var newSegmentCount = path.segments.length;
    	var difference = segmentCount - newSegmentCount;
    	var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    }

    const renderCanvas = doNothingIfRunning(async function () {
        console.log("edges2shoes requested");
        await executeOp(Operation.edges2shoes_pretrained);
        console.log("edges2shoes executed");
    })

    function clear() {

      // for (const layer of layers) layer.clear();
      //
      // p.background(255);

    }

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    async function executeOp(op: Operation) {

        // const canvas = fromGraphics.elt as HTMLCanvasElement;
        // const canvasData = await toBlob(canvas);
        // const reply = await comm.send(op, { canvasData });
        //
        // if(reply == undefined) {
        //     console.error('No reply from server')
        //     return
        // }
        //
        // if ('error' in reply) {
        //     console.error(`Error: ${reply.error}`);
        //     return reply.error;
        // }
        //
        // emit('drawoutput', reply.canvasData)
        //
        // return toGraphics;

    }
    //
    component.sketch = {
        renderCanvas,
        clear
    }
}

// functions returned by the p5 sketchs
type SketchMethods = {
    renderCanvas: () => void,
    clear: () => void
}

export class PaperCanvasComponent extends Component {
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
        //new (paper as any).default(make_sketch(this.comm, this.emit, this), element)
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

export function paperCanvasStore(state: State, emitter: Emitter) {
    emitter.on('setURL', url => {
        state.app.server.address = url;
        emitter.emit('render')
    })
    emitter.on('mlrender', () => {
        // hacky
        console.log(state.cache(PaperCanvasComponent, 'paper-canvas'))
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.renderCanvas()
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing canvas');
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.clear()
    })
}
