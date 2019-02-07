/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import { paper } from '../paperfix'
import { Comm, serialize, Operation } from '../comm'
import { doNothingIfRunning } from '../util'

let debugcanvas

type Layer = {
    model: string
    layer: paper.Layer
    clippingGroup?: paper.Group
}

const make_paper = (component: PaperCanvasComponent,
    canvas: HTMLCanvasElement, element, comm: Comm,
    emit: Emit, appState) => {
    const project = new paper.Project(canvas)
    console.log('papercanvas', project)
    let background = new paper.Layer(); //background
    background.activate()
    background.name = 'background'
    let rec = new paper.Rectangle(0, 0, 256, 256)
    var path_rec = new paper.Path.Rectangle(rec)
    path_rec.fillColor = '#ffffff'
    project.addLayer(background)

    let mTool = new paper.Tool()

    console.log(paper)
    var pathBeingDrawn: paper.Path
    addLayer()

    paper.project.view.onMouseDown = function (event) {
        project.activate()
        if(selectedObject) return;
        pathBeingDrawn = new paper.Path({
            segments: [event.point],
            strokeColor: 'black',
            fullySelected: true,
            name: 'temp'
        })
    }

    paper.project.view.onMouseDrag = function (event) {
        if(selectedObject) return;
        pathBeingDrawn.add(event.point)
    }

    paper.project.view.onMouseUp = function (event) {
        if(pathBeingDrawn == null) return;
        if(pathBeingDrawn.length < 3) {
            pathBeingDrawn.remove()
        }
        pathBeingDrawn.selected = false
        pathBeingDrawn.closed = true
        pathBeingDrawn.fillColor = "#FF000001"
        pathBeingDrawn.simplify(10);
        //console.log(project.activeLayer.name, project.layers)
        if(project.activeLayer.children['clippingGroup']){
          project.activeLayer.children['clippingGroup'].addChild(pathBeingDrawn)
        } else {
          debugger;
          console.log("error", project.activeLayer);
          const clippingGroup = new paper.Group()
          clippingGroup.name = 'clippingGroup'
          project.activeLayer.children['clippingGroup'].addChild(pathBeingDrawn)
        }

        if (pathBeingDrawn) {
            pathBeingDrawn.selected = false
        }
        pathBeingDrawn = null;
        if (selectedObject){
          selectedObject = null;
        }
    }

    var segment, path;
    var movePath = false;
    var selectedObject = null;

    mTool.onMouseDown = function (event) {
        segment = path = null;

        project.activeLayer.selected = false;
        if (selectedObject == null)
          return

    		path = selectedObject.item
    		if (selectedObject.type == 'segment') {
    			segment = selectedObject.segment;
    		} else if (selectedObject.type == 'stroke') {
    			var location = selectedObject.location;
          console.log("location: ", location.index, event.point);
    			segment = path.insert(location.index + 1, event.point);
    		}
    }

    mTool.onMouseMove = function(event) {
        let hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 2
        };
        project.activeLayer.selected = false;

        let hitResult = project.activeLayer.hitTestAll(event.point, hitOptions);
        if(hitResult[0] != undefined && hitResult[0].item) {
          hitResult[0].item.selected = true
          selectedObject = hitResult[0]
        } else {
          selectedObject = null
        }
    }


    mTool.onMouseDrag = function(event) {
    	if (segment) {
    		segment.point.x += event.delta.x;
        segment.point.y += event.delta.y;
    	} else if (path) {
        console.log("shifting position, pos before", path.position);
    		path.position.x += event.delta.x;
        path.position.y += event.delta.y;
        console.log("shifting position, pos after", path.position);
    	}
    }

    function rasterize() {
        project.activate()
        let rec = new paper.Rectangle(0, 0, 256, 256)
        var path_rec = new paper.Path.Rectangle(rec)
        path_rec.fillColor = '#ffffff'
        path_rec.sendToBack();
        const raster = paper.project.activeLayer.rasterize(72, false)
        path_rec.remove();
        const pt_topleft = new paper.Point(0, 0)
        const pt_bottomright = new paper.Point(raster.width, raster.height)
        if (raster.width > 256 || raster.height > 256) throw new Error('TODO: make it work for when u draw outside of the canvas')
        console.log(pt_bottomright, pt_topleft, paper.project.view)
        return raster.getImageData(new paper.Rectangle(pt_topleft, pt_bottomright))
    }

    const renderCanvas = doNothingIfRunning(async function (opName:string) {
        console.log("!!!!", opName, Operation[opName])
        await executeOp(Operation[opName])
        // if(opName in Operation) {
        //
        // } else {
        //   console.error("operation string doesn't exist!");
        // }
        console.log("Executed, finished awaiting")
    })

    async function executeOp(op: Operation) {
        project.activate()
        const canvas: HTMLCanvasElement = paper.view.element
        console.log("executing")
        console.log("rasterize", rasterize())
        const msg = await serialize(rasterize())
        const reply = await comm.send(op, msg)

        if (reply == undefined) {
            console.error('No reply from server')
            return
        }

        if ('error' in reply) {
            console.error(`Error: ${reply.error}`)
            return reply.error
        }

        emit('drawoutput', [reply.canvasData, project.activeLayer.children['clippingGroup'], appState.activeLayer])
    }

    function clear() {
        project.activate()
        paper.project.activeLayer.children['clippingGroup'].removeChildren()
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        const clippingGroup = new paper.Group()
        clippingGroup.name = 'clippingGroup'
        project.addLayer(layer)
        return {
            'paperLayer': layer,
            'clippingGroup': clippingGroup,
            'mirrorLayer': null,
            'model': 'edges2shoes_pretrained'
        }
    }

    function switchLayer(idx: number) {
        project.activate()
        project.layers[idx].activate()
    }

    function swapLayers(idxA: number, idxB: number) {
        const layerA = project.layers[idxA]
        const layerB = project.layers[idxB]
        project.insertLayer(idxA, layerB);
        project.insertLayer(idxB, layerA);
        //we also need to switch the layers inside the appState
    }

    component.sketch = {
        renderCanvas,
        clear,
        switchLayer,
        swapLayers,
        addLayer
    }
}

type SketchMethods = {
    renderCanvas: (s: string) => void,
    clear: () => void,
    switchLayer: (idx: number) => void,
    swapLayers: (idxA: number, idxB: number) => void,
    addLayer: () => void
}

export class PaperCanvasComponent extends Component {
    comm: Comm
    emit: Emit
    appState: AppState
    sketch: SketchMethods

    constructor(id: string, state: State, emit: Emit) {
        super(id)
        this.appState = state.app
        this.emit = emit
    }

    async load(element: HTMLElement) {
        this.comm = new Comm()
        await this.comm.connect(this.appState.server.address)

        var newcanvas: HTMLCanvasElement = document.createElement('canvas')
        newcanvas.style.backgroundColor = "white"
        newcanvas.width = 256
        newcanvas.height = 256
        newcanvas.id = "new"
        element.appendChild(newcanvas)

        make_paper(this, newcanvas, element, this.comm, this.emit, this.appState)
        setTimeout(() => this.emit('addLayer'), 10)
    }

    update(state: AppState) {
        if (state.server.address !== this.appState.server.address) {
            this.appState = state
            this.comm.connect(state.server.address)
        }
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div id="container">
    <p>paper input</p>
</div>`
    }
}

export function paperStore(state: State, emitter: Emitter) {
    emitter.on('mlrender', () => {
        // hacky
        console.log(state.app.activeLayer.model)
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.renderCanvas(state.app.activeLayer.model)
    })
    emitter.on('clear', () => {
        // hacky
        console.log('clearing canvas')
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.clear()
    })
    emitter.on('changeLayer', (layerIdx) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.switchLayer(layerIdx)
        state.app.activeLayer = state.app.layers[layerIdx - 1];
        emitter.emit('render')
    })
    emitter.on('addLayer', () => {
        let resultLayer = state.cache(PaperCanvasComponent, 'paper-canvas').sketch.addLayer()
        state.app.layers.push(resultLayer)
        state.app.activeLayer = resultLayer;
        console.log(state.app.layers)
        emitter.emit('render')
    })
}
