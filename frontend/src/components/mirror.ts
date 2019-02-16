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

    function drawOutput([bytes, paths]: [string, paper.Group]) {
        project.activate()
        console.log("mirror's active layer", project.activeLayer)
        let temp = bytes
        var image = document.createElement('img')
        image.src = 'data:image/png;base64,' + temp
        image.width = 256
        image.height = 256
        document.body.appendChild(image)
        var raster = new paper.Raster(image, new paper.Point(128, 128))
        paths.visible = true
        var gg = paths.clone()
        console.log(paper.project, paper.projects, gg, gg)
        project.activate();
        var g = new paper.Group([gg, raster])
        g.clipped = true
        console.log('mirror children', project.activeLayer.children)
        return
    }

    function clear() {
        project.activeLayer.removeChildren();
    }

    component.sketch = {
        drawOutput, clear
    }
}

type SketchMethods = {
    drawOutput: ([str, group]: [string, paper.Group]) => void
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
        let parent = document.getElementById("mirror-container");
        var newcanvas : HTMLCanvasElement = document.createElement('canvas')
        newcanvas.style.backgroundColor = "white"
        newcanvas.width = 256
        newcanvas.height = 256
        newcanvas.id = "mirror"
        parent.appendChild(newcanvas)

        make_mirror(this, newcanvas, element, this.emit)
    }

    update() {}

    createElement() {
        return html`
        <div>
          <div class="border border-horz top"><div class="border border-horz bottom"><div class="border-vert border left "><div class="border-vert border right">
            <div id="mirror-container"></div>
          </div></div></div></div>
        </div>`
    }
}

export function mirrorStore(state: State, emitter: Emitter) {
    emitter.on('drawoutput', ([bytes, path]) => {
        // hacky
        state.cache(MirrorComponent, 'p5-mirror').sketch.drawOutput([bytes, path])
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing mirror')
        state.cache(MirrorComponent, 'p5-mirror').sketch.clear()
    })
}
