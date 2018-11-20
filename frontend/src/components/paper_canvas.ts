/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html';
import Component from 'choo/component';
import { State, AppState, Emit, Emitter } from '../types';

import {paper} from '../paperfix';

const make_paper = (component: PaperCanvasComponent, canvas: HTMLCanvasElement) => {
  // Create an empty project and a view for the canvas:
    paper.setup(canvas);
    console.log(paper);
    var path;
    let appState;

    paper.project.view.onMouseDown = function(event) {
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
	      path.simplify(10);
    }
    function rasterize(){

      const raster = paper.project.activeLayer.rasterize();
      console.log(raster.width, raster.height);
      const pt_topleft = new paper.Point(0, 0);
      const pt_bottomright = new paper.Point(raster.width, raster.height);
      console.log("raster", raster.getImageData(new paper.Rectangle(pt_topleft, pt_bottomright)));
    }

    component.sketch = {
          rasterize
    }
}

type SketchMethods = {
  rasterize: () => void,
}

export class PaperCanvasComponent extends Component {
    emit: Emit;
    appState: AppState;
    sketch: SketchMethods;

    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app;
        this.emit = emit;
    }

    load(element: HTMLElement) {
        //element.innerText = 'Trying to connect to backend...'
        var newcanvas : HTMLCanvasElement = document.createElement('canvas');
        newcanvas.style.backgroundColor = "white";
        newcanvas.width = 256;
        newcanvas.height = 256;
        newcanvas.id = "new";
        element.appendChild(newcanvas);

        make_paper(this, newcanvas);
    }

    update(state: State) {
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div id="container"></div>`
    }
}

export function paperStore(state: State, emitter: Emitter) {
    // emitter.on('setURL', url => {
    //     state.app.server.address = url;
    //     emitter.emit('render')
    // })
    emitter.on('mlrender', () => {
        // hacky
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.rasterize()
    })
    emitter.on('clear', () => {
        // hacky
        // console.log('clearing canvas');
        // state.cache(PaperCanvasComponent, 'paper-canvas').sketch.clear()
    })
}
