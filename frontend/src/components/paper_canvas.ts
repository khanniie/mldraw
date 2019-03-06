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
            strokeColor: 'black',
            fullySelected: true,
            name: 'temp'
        })
        pathBeingDrawn.closed = state.closed
    }

    drawTool.onMouseDrag = function (event) {
        if(selectedObject) return;
        if(event.point.x < 0) event.point.x = 0
        if(event.point.y < 0) event.point.y = 0
        if(event.point.x >= viewWidth) event.point.x = Math.floor(viewWidth)
        if(event.point.y >= viewHeight) event.point.y = Math.floor(viewHeight)
        pathBeingDrawn.add(event.point)
    }

    drawTool.onMouseUp = function (event) {
        if(pathBeingDrawn == null) return;
        if(pathBeingDrawn.length < 3) {
            pathBeingDrawn.remove()
        }
        pathBeingDrawn.selected = false
        pathBeingDrawn.fillColor = '#FF000001'
        if(state.smoothing) pathBeingDrawn.simplify(10)
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
        let hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 100
        };
        project.activeLayer.selected = false
        const bounding: paper.Path.Rectangle = project.activeLayer.children['boundingRect']
        bounding.selected = true
        if(bounding.hitTest(event.point, hitOptions)) {
            let closest
            let closestDist = 1e9
            for (let i = 0; i < bounding.segments.length; i++) {
                var p = bounding.segments[i].point;
                if(p.getDistance(event.point) < closestDist) {
                    closestDist = p.getDistance(event.point)
                    closest = i
                }
            }
            if(event.point.getDistance(bounding.bounds.center) < closest) {
                bounding.data.moving = true
            } else {
                bounding.data.moving = false
                const opposite = (closest + 2) % 4
                bounding.data.from = bounding.segments[opposite].point;
                bounding.data.to = bounding.segments[closest].point;
            }
        } else if(bounding.contains(event.point)) {
            bounding.data.moving = true
        }
    }

    boundsEditingTool.onMouseDrag = function (event) {
        const bounding: paper.Path.Rectangle = project.activeLayer.children['boundingRect']
        bounding.selected = true
        if(bounding.data.moving) {
            bounding.bounds.center = event.point
        } else {        
            bounding.bounds = new paper.Rectangle(bounding.data.from, event.point)
            const aspect = bounding.bounds.width / bounding.bounds.height
            bounding.bounds.height = aspect * bounding.bounds.height
        }
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
        console.log(event.item);
        let item = event.item;
        if(item instanceof paper.Path) {
            item.remove();

        } else if(event.item != null) {
            const group = event.item
            let hitInfos = group.hitTestAll(event.point)
            // hitInfos = hitInfos.filter(hi => hi.item && hi.item instanceof paper.Path)
            // if(hitInfos.length == 0) return
            const smallest = hitInfos[0]
            let path = (smallest.item ? smallest.item : smallest) as paper.Path
            path.remove();
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
        console.log("edges2shoes requested")
        try {
            await executeOp(model as any)
            console.log("edges2shoes executed")
        } catch (e) {
            console.error('edges2shoes failed', e)
        }
    })

    async function executeOp(op: Operation) {
        console.log("active layer:", project.activeLayer);
        const canvas: HTMLCanvasElement = paper.view.element
        console.log("executing")
        const boundingRect = project.activeLayer.children['boundingRect'].bounds
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
        project.addLayer(layer)
        return [project.activeLayer.index, {
            layer, clippingGroup, model: 'edges2shoes_pretrained', mirrorLayer
        }];
    }

    function switchLayer(idx: number) {
        project.activate()
        //blunt force solution - optimize later to just be current layer toggle
        project.layers.map((lyr:paper.Layer) => (lyr.opacity = 0.2));
        project.layers[idx].opacity = 1
        project.layers[idx].activate()
        console.log("active layer:", project.activeLayer);
    }

    function swapLayers(idxA: number, idxB: number) {
        const layerA = project.layers[idxA]
        const layerB = project.layers[idxB]
        project.insertLayer(idxA, layerB);
        project.insertLayer(idxB, layerA);
    }

    function switchTool(tool){
        project.activeLayer.children['boundingRect'].selected = false
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
                project.activeLayer.children['boundingRect'].selected = true
                boundsEditingTool.activate();
                break;
            default:
                //donothing
                break;
        }
    }

    function setState(newState: AppState) {
        state = newState;
    }

    component.sketch = {
        renderCanvas,
        clear,
        switchLayer,
        swapLayers,
        addLayer,
        switchTool,
        setState
    }
}

type SketchMethods = {
    renderCanvas: () => void,
    clear: () => void,
    switchLayer: (idx: number) => void,
    swapLayers: (idxA: number, idxB: number) => void,
    addLayer: () => void,
    switchTool: (tool: string) => void,
    setState: (newState: AppState) => void
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
    emitter.on('isConnected', () => {
        state.app.server.isConnected = true;
        console.log(state.app.server, state.app.server.isConnected)
        emitter.emit('render')
    })

    emitter.on('mlrender', () => {
        // hacky
        const model = state.app.layers[state.app.activeLayer - 1].model
        console.log(model);
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.renderCanvas(model)
    })

    emitter.on('clear', () => {
        // hacky
        console.log('clearing canvas')
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.clear()
    })

    emitter.on('changeLayer', (layerIdx) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.switchLayer(layerIdx)
        state.app.activeLayer = layerIdx;
        emitter.emit('render')
    })

    emitter.on('addLayer', () => {
        let res = state.cache(PaperCanvasComponent, 'paper-canvas').sketch.addLayer()
        state.app.layers.push(res[1]);
        emitter.emit('changeLayer', res[0] + 1);
        emitter.emit('render')
    })

    emitter.on('setSmoothness', smooth => {
        state.app.smoothing = smooth
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setState(state)
        emitter.emit('render')
    })

    emitter.on('setClosed', close => {
        state.app.closed = close
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setState(state)
        emitter.emit('render')
    })

    emitter.on('switchTool', (tool) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.switchTool(tool)
    })

    emitter.on('setFill', (color) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setState(state)
    })

    // TODO: make a comm reducer
    emitter.on('addModel', (modelName) => {
        state.app.availableModels.push(modelName)
    })

}
