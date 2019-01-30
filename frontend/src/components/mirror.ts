/**
 * In this file we wrap the ml backend output in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'
import {paper} from '../paperfix';

import * as p5 from 'p5'

let debugcanvas;

// the type definition for p5.Graphics is wrong so
// we have to make our own
type Graphics = p5 & p5.Element
type Layer = Graphics;

// in its own function so it can be JIT compiled for performance
function copy<T>(fromArr: ArrayLike<T>, toArr: Array<T>) {
    const len = toArr.length;
    for (let i = 0; i < len; i++) toArr[i] = fromArr[i];
}

const make_mirror = (component: MirrorComponent,
                    canvas: HTMLCanvasElement, element,
                    emit: Emit) => {
    // Create an empty project and a view for the canvas:
    const project = new paper.Project(canvas);
    //new paper.View();
    let appState;

    // converts fromGraphics to a Blob, sends it to the server,
    // copies the pixel data in the response into toGraphics
    function drawOutput([bytes, paths]) {
        // gfx.loadPixels(); // required even though we don't read from pixels
        // // annoying that this copy is needed
        // copy(flippedBytes, gfx.pixels);
        // gfx.updatePixels();
        // p.image(gfx, 0, 0);
        project.activate();
        //let arr = new Uint8Array(bytes)
        let temp = bytes // String.fromCharCode.apply(null, arr);
        console.log("paper", paper);
        var image = document.createElement('img');
        image.src = 'data:image/png;base64,' + temp;
        image.width = 256;
        image.height = 256;
        let ctx = debugcanvas.getContext('2d')
        //ctx.drawImage(image, 0, 0, 256, 256, 0, 0, 256, 256);

        var raster = new paper.Raster(image, new paper.Point(128, 128));
        paths.visible = true;
        var gg = paths.clone();
        //gg.project = project;
        var g = new paper.Group([gg, raster]);
        g.clipped = true;

//         var star = new paper.Path.Star({
//     center: paper.view.center,
//     points: 6,
//     radius1: 20,
//     radius2: 40,
//     fillColor: 'red'
// });
//
// var circle = new paper.Path.Circle({
//     center: paper.view.center,
//     radius: 25,
//     strokeColor: 'black'
// });
//
// // Create a group of the two items and clip it:
// var group = new paper.Group([circle, star]);
// group.clipped = true;


        //var raster2 = new paper.Raster('https://news.nationalgeographic.com/content/dam/news/2018/05/17/you-can-train-your-cat/02-cat-training-NationalGeographic_1484324.ngsversion.1526587209178.adapt.1900.1.jpg');

        return;
    }

    component.sketch = {
        drawOutput
    }
}

type SketchMethods = {
    drawOutput: ([str, group]: [string, paper.Group]) => void;
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

        var newcanvas : HTMLCanvasElement = document.createElement('canvas');
        newcanvas.style.backgroundColor = "white";
        newcanvas.width = 256;
        newcanvas.height = 256;
        newcanvas.id = "mirror";
        element.appendChild(newcanvas);

        var newcanvas2 : HTMLCanvasElement = document.createElement('canvas');
        newcanvas2.style.backgroundColor = "white";
        newcanvas2.width = 256;
        newcanvas2.height = 256;
        newcanvas2.style.width = '256px';
        newcanvas2.style.height = '256px';
        newcanvas2.id = "mirror2";
        element.appendChild(newcanvas2);
        console.log(newcanvas2);
        debugcanvas = newcanvas2;

        make_mirror(this, newcanvas, element, this.emit);
    }

    createElement() {
        return html`<div></div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('drawoutput', ([bytes, path]) => {
        // hacky
        console.log("draw output called", bytes, path);
        state.cache(MirrorComponent, 'p5-mirror').sketch.drawOutput([bytes, path])
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing mirror');
        state.cache(MirrorComponent, 'p5-mirror').sketch.clear()
    })
}
