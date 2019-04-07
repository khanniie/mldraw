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
    let rec = new paper.Rectangle(0, 0, background.bounds.width, background.bounds.height)
    let path_rec = new paper.Path.Rectangle(rec)
    path_rec.fillColor = '#ffffff'
    project.addLayer(background)
    //new paper.View()

    function drawOutput([bytes, clippingPath, boundingRect]:
        [string | HTMLImageElement, paper.Group, paper.Rectangle]) {
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
        const raster = new paper.Raster(image, boundingRect.center)
        raster.fitBounds(boundingRect)
        console.log(clippingPath)
        const path = clippingPath.children.filter(ch => ch instanceof paper.Path || ch instanceof paper.CompoundPath)
        const united = path.reduce((a, p) => (a as any).unite(p))
        raster.position = boundingRect.center
        united.bringToFront()
        project.activeLayer.addChild(united)
        united.bringToFront()
        const clippingGroup = new paper.Group([united, raster])
        clippingGroup.clipped = true
        united.fillColor = '#FF00000F'
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
    drawOutput: ([str, group, boundingRect]: [string, paper.Group, paper.Rectangle]) => void
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
        newcanvas.setAttribute("resize", "true");
        // newcanvas.setAttribute('resize', 'false');
        element.appendChild(newcanvas)
        console.log(newcanvas)

        make_mirror(this, newcanvas, element, this.emit)
    }

    update() {}

    createElement() {
        return html`
        <div id ="mirror-canvas">
        </div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('canceloutput', () => {
        state.app.renderdone = true;
        emitter.emit('render')
    })

    emitter.on('drawoutput', ([bytes, path, boundingRect]) => {
        // hacky
        state.app.renderdone = true;
        emitter.emit('render')
        state.cache(MirrorComponent, 'mirror-canvas').sketch.drawOutput([bytes, path, boundingRect])
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
