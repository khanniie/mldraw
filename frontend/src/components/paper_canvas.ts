/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html';
import Component from 'choo/component';
import { State, AppState, Emit, Emitter } from '../types';

import {paper} from '../paperfix';
import { Comm, toBlob, Operation } from '../comm'
import { doNothingIfRunning } from '../util'

let debugcanvas;

const make_paper = (component: PaperCanvasComponent,
                    canvas: HTMLCanvasElement, element, comm: Comm,
                    emit: Emit) => {
    // Create an empty project and a view for the canvas:
    const project = new paper.Project(canvas);
    //new paper.View();
    let rec = new paper.Rectangle(0, 0, 256, 256);
    var path_rec = new paper.Path.Rectangle(rec);
    path_rec.fillColor = '#ffffff';
    console.log(paper);
    var path;
    let appState;
    let paths = new paper.Group();
    paths.visible = false;

    paper.project.view.onMouseDown = function(event) {
      project.activate();
  	  // If we produced a path before, deselect it:
  	  if (path) {
  		  path.selected = false;
  	  }
  	   // Create a new path and set its stroke color to black:
  	  path = new paper.Path({
  		  segments: [event.point],
  		  strokeColor: 'black',
  	  	// Select the path, so we can see its segment points:
  		  fullySelected: true
  	  });
    }
    paper.project.view.onMouseDrag = function(event) {
	     path.add(event.point);
    }
    paper.project.view.onMouseUp = function(event) {
	     // When the mouse is released, simplify it:
        path.selected = false;
        path.closed = true;
	      path.simplify(10);
        let temp_path = path.clone()
        paths.addChild(temp_path);
    }
    function rasterize(){

      const raster = paper.project.activeLayer.rasterize();
      console.log(raster.width, raster.height, paper.project.activeLayer);
      const pt_topleft = new paper.Point(0, 0);
      const pt_bottomright = new paper.Point(raster.width, raster.height);
      console.log("raster", raster.getImageData(new paper.Rectangle(pt_topleft, pt_bottomright)));

      //later, probably want to make new canvas, draw layer and send
      var newcanvas : HTMLCanvasElement = document.createElement('canvas');
      newcanvas.style.backgroundColor = "white";
      newcanvas.width = 256;
      newcanvas.height = 256;
      newcanvas.id = "hidden";
      element.appendChild(newcanvas);
    }

    const renderCanvas = doNothingIfRunning(async function () {
        console.log("edges2shoes requested");
        await executeOp(Operation.edges2shoes_pretrained);
        console.log("edges2shoes executed");
    })

    async function executeOp(op: Operation ) {
        project.activate();
        console.log(paper);
        const canvas :HTMLCanvasElement= paper.view.element;
        let ctx = debugcanvas.getContext('2d');
        if(canvas.width == 512){
          ctx.drawImage(canvas, 0, 0, 512, 512, 0, 0, 256, 256);
        } else {
          ctx.drawImage(canvas, 0, 0, 256, 256, 0, 0, 256, 256);
        }
        const canvasData = await toBlob(debugcanvas);
        const reply = await comm.send(op, { canvasData });

        if(reply == undefined) {
            console.error('No reply from server')
            return
        }

        if ('error' in reply) {
            console.error(`Error: ${reply.error}`);
            return reply.error;
        }
        console.log("got a reply...")
        emit('drawoutput', [reply.canvasData, paths]);

    }

    component.sketch = {
          renderCanvas
    }
}

type SketchMethods = {
  renderCanvas: () => void,
}

export class PaperCanvasComponent extends Component {
    comm: Comm;
    emit: Emit;
    appState: AppState;
    sketch: SketchMethods;

    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app;
        this.emit = emit;
    }

    async load(element: HTMLElement) {
        //element.innerText = 'Trying to connect to backend...'
        this.comm = new Comm()
        await this.comm.connect(this.appState.server.address)

        var newcanvas : HTMLCanvasElement = document.createElement('canvas');
        newcanvas.style.backgroundColor = "white";
        newcanvas.width = 256;
        newcanvas.height = 256;
        newcanvas.id = "new";
        element.appendChild(newcanvas);

        //for debug purposes
        var newcanvas2 : HTMLCanvasElement = document.createElement('canvas');
        newcanvas2.style.backgroundColor = "white";
        newcanvas2.width = 256;
        newcanvas2.height = 256;
        newcanvas2.style.width = '256px';
        newcanvas2.style.height = '256px';
        newcanvas2.id = "new2";
        element.appendChild(newcanvas2);
        console.log(newcanvas2);
        debugcanvas = newcanvas2;

      //  make_paper(this, newcanvas, newcanvas2, element, this.comm, this.emit);
      make_paper(this, newcanvas, element, this.comm, this.emit);
    }

    update(state: State) {
        if (state.app.server.address !== this.appState.server.address) {
            this.appState = state.app;
            this.comm.connect(state.app.server.address)
        }
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div id="container"><p>paper input</p></div>`
    }
}

export function paperStore(state: State, emitter: Emitter) {
    // emitter.on('setURL', url => {
    //     state.app.server.address = url;
    //     emitter.emit('render')
    // })
    emitter.on('mlrender', () => {
        // hacky
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.renderCanvas()
    })
    emitter.on('clear', () => {
        // hacky
        // console.log('clearing canvas');
        // state.cache(PaperCanvasComponent, 'paper-canvas').sketch.clear()
    })
}
