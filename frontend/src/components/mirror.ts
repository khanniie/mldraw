/**
 * In this file we wrap the ml backend output in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter, Layer } from '../types'
import {paper} from '../paperfix'

import * as p5 from 'p5'

let debugcanvas

// in its own function so it can be JIT compiled for performance
function copy<T>(fromArr: ArrayLike<T>, toArr: Array<T>) {
    const len = toArr.length
    for (let i = 0; i < len; i++) toArr[i] = fromArr[i]
}

const make_mirror = (component: MirrorComponent,
                    canvas: HTMLCanvasElement, element,
                    emit: Emit, state) => {
    // Create an empty project and a view for the canvas:
    const project = new paper.Project(canvas)
    console.log('mirror', project)
    //new paper.View()
    let appState = state

    function drawOutput([bytes, paths, layer]: [string, paper.Group, Layer]) {
        project.activate()
        let temp = bytes
        var image = document.createElement('img')
        image.src = 'data:image/png;base64,' + temp
        image.width = 256
        image.height = 256
        document.body.appendChild(image)
        let mirrorLayer = layer.mirrorLayer != null ? layer.mirrorLayer : new paper.Layer();
        mirrorLayer.activate();
        mirrorLayer.removeChildren();

        var raster = new paper.Raster(image, new paper.Point(128, 128))
        paths.visible = true
        var gg = paths.clone()
        //project.activate();
        var g = new paper.Group([gg, raster])
        g.clipped = true
        layer.mirrorLayer = project.activeLayer;
        console.log('mirror children', project.activeLayer.children)
        return
    }

    function clear() {
        if(state.activeLayer.mirrorLayer) state.activeLayer.mirrorLayer.removeChildren();
    }

    component.sketch = {
        drawOutput, clear
    }
}

type SketchMethods = {
    drawOutput: ([str, group, layer]: [string, paper.Group, Layer]) => void
    clear: () => void
}

export class MirrorComponent extends Component {
    emit: Emit
    appState: AppState
    sketch: SketchMethods
    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app
        this.emit = emit
    }

    async load(element) {

        var newcanvas : HTMLCanvasElement = document.createElement('canvas')
        newcanvas.style.backgroundColor = "white"
        newcanvas.width = 256
        newcanvas.height = 256
        newcanvas.id = "mirror"
        element.appendChild(newcanvas)

        make_mirror(this, newcanvas, element, this.emit, this.appState)
    }

    update() {}

    createElement() {
        return html`<div></div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('drawoutput', ([bytes, path, layer]) => {
        // hacky
        state.cache(MirrorComponent, 'p5-mirror').sketch.drawOutput([bytes, path, layer])
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing mirror')
        state.cache(MirrorComponent, 'p5-mirror').sketch.clear()
    })
}
