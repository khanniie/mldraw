/**
 * In this file we wrap the p5.js basic sketch in a choojs component
 */
import html from 'choo/html'
import Component from 'choo/component'
import { State, AppState, Emit, Emitter } from '../types'

import { paperLocal as paper } from '../paperfix'
import { Comm, serialize, Operation } from '../comm'
import { doNothingIfRunning } from '../util'

type Layer = {
    model: string
    layer: paper.Layer
    clippingGroup?: paper.Group
}

const make_paper = (component: PaperCanvasComponent,
    canvas: HTMLCanvasElement, element, comm: Comm,
    emit: Emit, state: AppState) => {
    const project = new paper.Project(canvas)
    let background = new paper.Layer(); //background
    background.activate()
    background.name = 'background'
    let {width: viewWidth, height: viewHeight} = paper.project.view.bounds
    paper.project.view.onResize = () => {
        ({width: viewWidth, height: viewHeight} = paper.project.view.bounds)
    }

    let rec = new paper.Rectangle(0, 0, background.bounds.width, background.bounds.height)
    let path_rec = new paper.Path.Rectangle(rec)
    path_rec.fillColor = '#ffffff'
    path_rec.name = 'boundingRect'
    path_rec.selected = false
    project.addLayer(background)

    // let fill = false;
    //let fillColor: string;
    //let smoothing = false;
    //let autoclose = true;
    const activeBounds = () => project.activeLayer.children['boundingRect'] as paper.Path.Rectangle

    let dragTool = new paper.Tool();
    let drawTool = new paper.Tool();
    let fillTool = new paper.Tool();
    let cutTool = new paper.Tool();
    let boundsEditingTool = new paper.Tool()
    drawTool.activate();

    console.log(paper)
    var pathBeingDrawn: paper.Path


    drawTool.onMouseDown = function (event) {
        project.activate()
        if(selectedObject) return;
        pathBeingDrawn = new paper.Path({
            segments: [event.point],
            strokeColor: state.strokeColor,
            fullySelected: true,
            name: 'temp'
        })
        pathBeingDrawn.closed = state.closed
    }

    drawTool.onMouseDrag = function (event) {
        if(selectedObject) return;
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
                                        Math.max(0, Math.min(event.point.y, viewHeight)))
        pathBeingDrawn.add(clamped)
    }

    drawTool.onMouseUp = function (event) {
        if(pathBeingDrawn == null) return;
        if(pathBeingDrawn.length < 3) {
            pathBeingDrawn.remove()
        }
        pathBeingDrawn.selected = false
        pathBeingDrawn.fillColor = '#FF000001'
        if(state.smoothing) pathBeingDrawn.simplify(10)
        if(pathBeingDrawn.length > 0.001) project.activeLayer.data.empty = false
        if(project.activeLayer.children['clippingGroup']){
          project.activeLayer.children['clippingGroup'].addChild(pathBeingDrawn)
        } else {
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

    dragTool.onMouseDown = function (event) {
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

    dragTool.onMouseMove = function(event) {
        let hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 2
        };
        project.activeLayer.selected = false

        let hitResult = project.activeLayer.hitTestAll(event.point, hitOptions);
        if(hitResult[0] != undefined && hitResult[0].item) {
          hitResult[0].item.selected = true
          selectedObject = hitResult[0]
        } else {
          selectedObject = null
        }
    }


    dragTool.onMouseDrag = function(event) {
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

    boundsEditingTool.onMouseDown = function(event) {
        const bounding = activeBounds()
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
                                        Math.max(0, Math.min(event.point.y, viewHeight)))
        bounding.data.startCorner = clamped
        bounding.selected = true
    }

    boundsEditingTool.onMouseDrag = function (event) {
        const bounding = activeBounds()
        bounding.selected = true
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
                                        Math.max(0, Math.min(event.point.y, viewHeight)))

        const delta: paper.Point = bounding.data.startCorner.subtract(clamped)
        console.log(delta)
        if(Math.abs(delta.x) < 10 || Math.abs(delta.y) < 10) return
        if(Math.abs(delta.x) > Math.abs(delta.y)) {
            delta.y = Math.sign(delta.y) * Math.abs(delta.x);
        } else {
            delta.x = Math.sign(delta.x) * Math.abs(delta.y);
        }
        const otherCorner = bounding.data.startCorner.add(delta.multiply(-1))
        bounding.bounds = new paper.Rectangle(bounding.data.startCorner, otherCorner)
    }

    cutTool.onMouseMove = function(event) {
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


    cutTool.onMouseDown = function(event: paper.ToolEvent) {
        project.activate()
        let item = event.item;
        if(item instanceof paper.Path) {
            item.remove();

        } else if(event.item != null) {
            let hitOptions = {
                segments: true,
                stroke: true,
                fill: true,
                tolerance: 2
            };
            let hitResult = project.activeLayer.hitTestAll(event.point, hitOptions);
            let item;
            if(hitResult[0] != undefined && hitResult[0].item) {
              item = hitResult[0];
              let path = (item.item ? item.item : item) as paper.Path
              path.remove();
            }

        }
    }



    fillTool.onMouseDown = function(event: paper.ToolEvent) {
        project.activate()
        if(state.paintbucket.active) {
            if(event.item instanceof paper.Path) {
                let path = event.item
                path.fillColor = state.paintbucket.palette[state.paintbucket.colorName]
                path.strokeColor = "#00000000"

            } else if(event.item != null) {
                const group = project.activeLayer
                let hitInfos = group.hitTestAll(event.point)
                hitInfos = hitInfos.filter(hi => hi.item && hi.item instanceof paper.Path)
                if(hitInfos.length == 0) return
                const smallest = hitInfos[0]
                let path = (smallest.item ? smallest.item : smallest) as paper.Path
                path.fillColor = state.paintbucket.palette[state.paintbucket.colorName]
                path.strokeColor = "#00000000"
            }
        }
    }

    fillTool.onMouseMove = function(event) {
        project.activate()
        project.activeLayer.selected = false;

        let hitResult = project.activeLayer.hitTestAll(event.point);
        if(hitResult[0] != undefined && hitResult[0].item) {
          hitResult[0].item.selected = true
          selectedObject = hitResult[0]
        } else {
          selectedObject = null
        }
    }

    function rasterize(boundingRect: paper.Rectangle): [ImageData, paper.Group] {
        project.activate()
        const {width: boundWidth, height: boundHeight} = boundingRect
        const layerBgRect = new paper.Path.Rectangle(project.view.bounds)
        layerBgRect.fillColor = '#ffffff'
        const bgRect = new paper.Path.Rectangle(boundingRect)
        bgRect.fillColor = "#ffffff"
        bgRect.sendToBack()
        layerBgRect.sendToBack()
        // scale it so the raster area within the bounds is 256x256
        const [scaleX, scaleY] = [255/boundWidth, 255/boundHeight]
        const scaledClippingGroup: paper.Group = paper.project.activeLayer.children['clippingGroup'].clone()
        scaledClippingGroup.remove()

        paper.project.activeLayer.scale(scaleX, scaleY, boundingRect.topLeft)
        console.log(boundingRect.topLeft)
        // top left corner of bounding rect
        const {x, y} = bgRect.bounds // how far "off the page" the top left corner is
        console.log(bgRect.bounds)
        bgRect.remove()
        const unfilledPartsHack = paper.project.activeLayer.children['clippingGroup'].children.filter(c => c.fillColor.alpha < 0.01)
        paper.project.activeLayer.children['clippingGroup'].children.forEach(e => {console.log(e.fillColor.alpha)})
        unfilledPartsHack.forEach(path => {
            path.fillColor = null
        })
        console.log(unfilledPartsHack.length)
        const raster = paper.project.activeLayer.rasterize(72, false)
        unfilledPartsHack.forEach(path => {
            path.fillColor = '#FF000001'
        })
        const pt_topleft = new paper.Point(Math.ceil(scaleX * x),
                                           Math.ceil(scaleY * y))
        const pt_bottomright = new paper.Size(256, 256)
        //bgRect.remove()2
        layerBgRect.remove()
        paper.project.activeLayer.scale(1/scaleX, 1/scaleY, boundingRect.topLeft)
        return [raster.getImageData(new paper.Rectangle(pt_topleft, pt_bottomright)),
            scaledClippingGroup]
    }

    const renderCanvas = doNothingIfRunning(async function (model) {
        console.log(model + " requested")
        try {
            await executeOp(model as any)
            console.log("remove animation here")
        } catch (e) {
            console.error(model + ' failed', e)
        }
    })

    async function executeOp(op: Operation) {
        console.log("active layer:", project.activeLayer);
        if(project.activeLayer.data.empty) {
            emit('canceloutput')
            return
        }
        const canvas: HTMLCanvasElement = paper.view.element
        console.log("executing")
        const boundingRect = activeBounds().bounds
        const [raster, clippingGroup] = rasterize(boundingRect)
        const reply = await comm.send(op, raster)

        if (reply == undefined) {
            console.error('No reply from server')
            return
        }

        if ('error' in reply) {
            console.error(`Error: ${reply.error}`)
            return reply.error
        }
        console.log("got a reply...")
        emit('drawoutput', [reply.canvasData, clippingGroup, boundingRect])
        console.log("active layer AFTER", project.activeLayer)

    }

    function clear() {
        project.activate()
        project.activeLayer.children['clippingGroup'].removeChildren()
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        let idx = layer.index;
        const clippingGroup = new paper.Group()
        const mirrorLayer = null
        clippingGroup.name = 'clippingGroup'
        const boundingRectPath = new paper.Path.Rectangle(paper.view.bounds.clone().scale(0.99))
        boundingRectPath.name = 'boundingRect'
        boundingRectPath.strokeColor = '#0000005F'
        boundingRectPath.dashArray = [2, 40]
        project.addLayer(layer)
        layer.data.empty = true
        return [project.activeLayer.index, {
            layer, clippingGroup, model: 'edges2shoes_pretrained', mirrorLayer
        }];
    }

    function switchLayer(idx: number) {
        project.activate()
        //blunt force solution - optimize later to just be current layer toggle
        project.layers.map((lyr:paper.Layer) => (lyr.opacity = 0.2));
        project.layers[idx].opacity = 1
        const prevActiveLayer = project.activeLayer
        project.layers[idx].activate()
        if(prevActiveLayer != project.activeLayer) {
            console.log('going back to draw tool')
            prevActiveLayer.children['boundingRect'].strokeColor = null
            emit('switchTool', 'draw')    
        }
        activeBounds().strokeColor = '#0000005F'
        console.log("active layer:", project.activeLayer);
    }

    function swapLayers(idxA: number, idxB: number) {
        const layerA = project.layers[idxA]
        const layerB = project.layers[idxB]
        project.insertLayer(idxA, layerB);
        project.insertLayer(idxB, layerA);
    }

    function switchTool(tool){
        for(const layer of project.layers) layer.children['boundingRect'].selected = false
        switch (tool) {
            case 'cut':
                cutTool.activate();
                break;
            case 'drag':
                dragTool.activate();
                break;
            case 'draw':
                drawTool.activate();
                break;
            case 'fill':
                fillTool.activate();
                break;
            case 'bounds':
                activeBounds().selected = true
                boundsEditingTool.activate();
                break;
            default:
                //donothing
                break;
        }
    }

    function resetFills() {
        project.activate()
        for(const item of project.activeLayer.children['clippingGroup'].children) {
            if(item instanceof paper.Path) {
                item.fillColor = '#00000001'
                item.strokeColor = '#000000'
            }
        }
    }


    function resetBounds() {
        project.activate()
        activeBounds().bounds = paper.view.bounds.clone().scale(0.99)
    }

    function setState(newState: AppState) {
        state = newState;
        console.log(state)
    }

    component.sketch = {
        renderCanvas,
        clear,
        switchLayer,
        swapLayers,
        addLayer,
        switchTool,
        setState,
        resetBounds,
        resetFills
    }
}

type SketchMethods = {
    renderCanvas: () => void,
    clear: () => void,
    switchLayer: (idx: number) => void,
    swapLayers: (idxA: number, idxB: number) => void,
    addLayer: () => void,
    switchTool: (tool: string) => void,
    setState: (newState: AppState) => void,
    resetBounds: () => void,
    resetFills: () => void
}


function setMouseDown(state, emit){
  state.mouseOnCanvas = true;
  console.log("stat:" + state.mouseOnCanvas);
  emit('render');
}

function setMouseUp(state, emit){
  state.mouseOnCanvas = false;
  console.log("stat:" + state.mouseOnCanvas);
  emit('render');
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
        newcanvas.style.height = "100%"
        newcanvas.width = 256
        newcanvas.height = 256
        newcanvas.id = "new"
        element.appendChild(newcanvas)

        element.onmousedown = (() => setMouseDown(this.appState, this.emit));
        element.onmouseup = (() => setMouseUp(this.appState, this.emit))

        make_paper(this, newcanvas, element, this.comm, this.emit, this.appState)
        setTimeout(() => this.emit('isConnected'), 1)
        setTimeout(() => this.emit('addLayer'), 20)
        setTimeout(() => {
            for(const modelName of this.comm.available_models()) {
                this.emit('addModel', modelName)
            }
        })
    }

    update(state: AppState) {
        if (state.server.address !== this.appState.server.address) {
            this.appState = state
            this.comm.connect(state.server.address)
        }
        this.sketch.setState(state)
        return false // doesn't need choo to re-render it
    }

    createElement() {
        return html`<div id="paper-canvas"></div>`
    }
}

export function paperStore(state: State, emitter: Emitter) {

    const sketch = () => state.cache(PaperCanvasComponent, 'paper-canvas').sketch

    emitter.on('isConnected', () => {
        state.app.server.isConnected = true;
        console.log(state.app.server, state.app.server.isConnected)
        emitter.emit('render')
    })

    emitter.on('mlrender', () => {
        // hacky
        state.app.renderdone = false;
        emitter.emit('render')
        const model = state.app.layers[state.app.activeLayer - 1].model
        sketch().renderCanvas(model)
    })

    emitter.on('clear', () => {
        // hacky
        console.log('clearing canvas')
        sketch().clear()
    })

    emitter.on('changeLayer', (layerIdx) => {
        sketch().switchLayer(layerIdx)
        state.app.activeLayer = layerIdx;
        emitter.emit('render')
    })

    emitter.on('addLayer', () => {
        let res = sketch().addLayer()
        state.app.layers.push(res[1]);
        emitter.emit('changeLayer', res[0] + 1);
        emitter.emit('render')
    })

    emitter.on('setSmoothness', smooth => {
        state.app.smoothing = smooth
        sketch().setState(state.app)
        emitter.emit('render')
    })

    emitter.on('setClosed', close => {
        state.app.closed = close
        sketch().setState(state.app)
        emitter.emit('render')
    })

    emitter.on('switchTool', (tool) => {
        state.app.tool = tool;
        sketch().switchTool(tool)
    })

    emitter.on('setStrokeColor', strokeColor => {
        state.app.strokeColor = strokeColor
        sketch().setState(state.app)
        emitter.emit('switchTool', 'draw')
        emitter.emit('render')
    })

    emitter.on('setFill', (color) => {
        sketch().setState(state.app)
    })

    emitter.on('resetBounds', () => {
        sketch().resetBounds()
    })

    emitter.on('resetFills', () => {
        sketch().resetFills()
    })

    // TODO: make a comm reducer
    emitter.on('addModel', (modelName) => {
        state.app.availableModels.push(modelName)
    })

}
