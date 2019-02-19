/**
 * In this file we wrap the ml backend output in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'
import {paper} from '../paperfix'

import * as p5 from 'p5'

let debugcanvas

// the type definition for p5.Graphics is wrong so
// we have to make our own
type Graphics = p5 & p5.Element
type Layer = Graphics

// in its own function so it can be JIT compiled for performance
function copy<T>(fromArr: ArrayLike<T>, toArr: Array<T>) {
    const len = toArr.length
    for (let i = 0; i < len; i++) toArr[i] = fromArr[i]
}

const make_mirror = (component: MirrorComponent,
                    canvas: HTMLCanvasElement, element,
                    emit: Emit) => {
    // Create an empty project and a view for the canvas:
    const project = new paper.Project(canvas)
    console.log('mirror', project)
    //new paper.View()
    let appState

    function drawOutput([bytes, clippingPath]: [string | HTMLImageElement, paper.Group]) {
        project.activate()
        project.activeLayer.removeChildren()
        let image;
        if(bytes instanceof HTMLImageElement) {
            image = bytes
        } else {
            image = document.createElement('img')
            image.src = 'data:image/png;base64,' + bytes
            image.width = 256
            image.height = 256
        }
        const raster = new paper.Raster(image, new paper.Point(128, 128))
        clippingPath.visible = true
        const path = clippingPath.children.filter(ch => ch instanceof paper.Path)
        const united = path.reduce((a, p) => a.unite(p))
        project.activate()
        const clippingGroup = new paper.Group([united, raster])
        clippingGroup.clipped = true
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        console.log('adding mirror lyr')
        project.addLayer(layer)
    }

    function switchLayer(idx: number) {
        project.activate()
        console.log(idx, project.layers)
        project.layers[idx].activate()
    }

    function clear() {
        project.activeLayer.removeChildren()
    }
    
    component.sketch = {
        drawOutput, clear, switchLayer, addLayer
    }
}

type SketchMethods = {
    drawOutput: ([str, group]: [string, paper.Group]) => void
    clear: () => void,
    addLayer: () => void,
    switchLayer: (idx: number) => void
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

        make_mirror(this, newcanvas, element, this.emit)
    }

    update() {}

    createElement() {
        return html`
        <div>
        </div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('drawoutput', ([bytes, path]) => {
        // hacky
        state.cache(MirrorComponent, 'mirror-canvas').sketch.drawOutput([bytes, path])
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing mirror')
        state.cache(MirrorComponent, 'mirror-canvas').sketch.clear()
    })
    emitter.on('changeLayer', (layerIdx) => {
        state.cache(MirrorComponent, 'mirror-canvas').sketch.switchLayer(layerIdx - 1)
    })

    emitter.on('addLayer', () => {
        state.cache(MirrorComponent, 'mirror-canvas').sketch.addLayer()
    })

}
