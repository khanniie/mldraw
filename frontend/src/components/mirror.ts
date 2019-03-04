/**
 * In this file we wrap the ml backend output in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'
import {paperLocal as paper} from '../paperfix'

let debugcanvas
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
    let background = new paper.Layer(); //background
    background.activate()
    background.name = 'background'
    const {width: viewWidth, height: viewHeight} = paper.project.view.bounds
    console.log('mirror !!', paper.project.view.bounds)
    let rec = new paper.Rectangle(0, 0, background.bounds.width, background.bounds.height)
    let path_rec = new paper.Path.Rectangle(rec)
    path_rec.fillColor = '#ffffff'
    project.addLayer(background)
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
        const path = clippingPath.children.filter(ch => ch instanceof paper.Path)
        const united = path.reduce((a, p) => a.unite(p))
        united.bringToFront()
        const clippingGroup = new paper.Group([united, raster])
        clippingGroup.position = paper.view.bounds.center
        console.log(clippingGroup.bounds)
        clippingGroup.scale(paper.view.bounds.width/clippingGroup.bounds.width)
        clippingGroup.clipped = true
        console.log(clippingGroup, clippingGroup.bounds)
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        console.log('adding mirror lyr')
        project.addLayer(layer)
    }

    function switchLayer(idx: number) {
        project.activate()
        console.log("switch layer", idx, project.layers);
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
        console.log(newcanvas)

        make_mirror(this, newcanvas, element, this.emit)
    }

    update() {}

    createElement() {
        return html`
        <div id="mirror-container">
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
