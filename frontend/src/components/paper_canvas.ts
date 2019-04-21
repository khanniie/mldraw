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
    const background = new paper.Layer(); //background
    background.activate()
    background.name = 'background'
    let { width: viewWidth, height: viewHeight } = paper.project.view.bounds

    const bgLayerRect = new paper.Rectangle(0, 0, background.bounds.width, background.bounds.height)
    const bgLayerFill = new paper.Path.Rectangle(bgLayerRect)
    bgLayerFill.fillColor = '#ffffff'
    bgLayerFill.name = 'boundingRect'
    bgLayerFill.selected = false
    const boundingViewGroup = new paper.Group();
    boundingViewGroup.addChild(bgLayerFill);
    boundingViewGroup.name = 'boundingViewGroup'

    const boundingViewContainer = new paper.Group();
    boundingViewContainer.addChild(boundingViewGroup);
    boundingViewContainer.name = 'boundingViewContainer'

    const cm = new paper.Group()
    cm.name = 'customMask'

    project.addLayer(background)
    console.log(project.layers);

    paper.project.view.onResize = () => {
        ({ width: viewWidth, height: viewHeight } = paper.project.view.bounds)
    }

    const activeBounds = () => project.activeLayer.children['boundingViewContainer'].children['boundingViewGroup'].children['boundingRect'] as paper.Path.Rectangle
    const activeBoundsContainer = () => project.activeLayer.children['boundingViewContainer'] as paper.Group
    const clipGroup = () => project.activeLayer.children['clippingGroup'] as paper.Group
    const customMask = () => project.activeLayer.children['customMask'] as paper.Group

    /**
     * Tools
     */

    const dragTool = new paper.Tool()
    const drawTool = new paper.Tool()
    const fillTool = new paper.Tool()
    const cutTool = new paper.Tool()
    const boundsEditingTool = new paper.Tool()
    drawTool.activate()
    let pathBeingDrawn: paper.Path

    drawTool.onMouseDown = function (event) {
        project.activate()
        if (selectedObject) return
        pathBeingDrawn = new paper.Path({
            segments: [event.point],
            strokeColor: state.strokeColor,
            fullySelected: true,
            name: 'temp'
        })
        pathBeingDrawn.closed = state.maskEditingMode || state.closed
        if(state.maskEditingMode) {
            const overlay = customMask().children['overlay'] as paper.CompoundPath
            if(overlay.hitTest(event.point)) {
                console.log('started inside')
                overlay.data.remove = true
            } else {
                overlay.data.remove = false
            }
        }
    }

    drawTool.onMouseDrag = function (event) {
        if (selectedObject) return;
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
            Math.max(0, Math.min(event.point.y, viewHeight)))
        pathBeingDrawn.add(clamped)
    }

    drawTool.onMouseUp = function (event) {
        if (pathBeingDrawn == null) return;
        if (pathBeingDrawn.length < 3) {
            pathBeingDrawn.remove()
        }
        pathBeingDrawn.selected = false
        pathBeingDrawn.fillColor = '#FF000001'
        if (state.smoothing) pathBeingDrawn.simplify(10)
        if (pathBeingDrawn.length > 0.001) project.activeLayer.data.empty = false
        if (state.maskEditingMode) {
            const overlay = customMask().children['overlay'] as paper.CompoundPath
            const result = overlay.data.remove ? overlay.subtract(pathBeingDrawn) : overlay.unite(pathBeingDrawn)
            overlay.remove()
            result.name = 'overlay'
            pathBeingDrawn.visible = false
            customMask().addChild(result)
            customMask().addChild(pathBeingDrawn)
            customMask().data.isUsed = true
            //project.activeLayer.children['overlay'].sendToBack()
        } else {
            clipGroup().addChild(pathBeingDrawn)
        }
        if (pathBeingDrawn) {
            pathBeingDrawn.selected = false
        }
        pathBeingDrawn = null
        if (selectedObject) {
            selectedObject = null
        }
    }

    let segment = null
    let path = null
    let selectedObject = null

    dragTool.onMouseDown = function (event) {
        project.activate()
        segment = path = null

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

    dragTool.onMouseMove = function (event) {
        let hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 2
        };
        project.activeLayer.selected = false

        let hitResult
        if (!state.maskEditingMode) {
            hitResult = clipGroup().hitTestAll(event.point, hitOptions)
        } else {
            hitResult = customMask().hitTestAll(event.point, hitOptions)
        }
        if (hitResult[0] != undefined && hitResult[0].item) {
            hitResult[0].item.selected = true
            selectedObject = hitResult[0]
        } else {
            selectedObject = null
        }
    }


    dragTool.onMouseDrag = function (event) {
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


    boundsEditingTool.onMouseDown = function (event) {
        project.activate()

        const bounding = activeBounds()
        console.log(bounding)
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
            Math.max(0, Math.min(event.point.y, viewHeight)))
        bounding.data.startCorner = clamped
        bounding.selected = true
    }


    boundsEditingTool.onMouseDrag = function (event) {
        const bounding = activeBounds()
        console.log(bounding)
        bounding.selected = true
        const clamped = new paper.Point(Math.max(0, Math.min(event.point.x, viewWidth)),
            Math.max(0, Math.min(event.point.y, viewHeight)))

        const delta: paper.Point = bounding.data.startCorner.subtract(clamped)
        if (Math.abs(delta.x) < 10 || Math.abs(delta.y) < 10) return
        if (Math.abs(delta.x) > Math.abs(delta.y)) {
            delta.y = Math.sign(delta.y) * Math.abs(delta.x);
        } else {
            delta.x = Math.sign(delta.x) * Math.abs(delta.y);
        }
        const otherCorner = bounding.data.startCorner.add(delta.multiply(-1))
        bounding.bounds = new paper.Rectangle(bounding.data.startCorner, otherCorner)
        //const boundingViewGroup = activeBoundsGroup();
    }

    cutTool.onMouseMove = function (event) {
        const hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 2
        };
        project.activeLayer.selected = false;

        let hitResult
        if (!state.maskEditingMode) {
            hitResult = clipGroup().hitTestAll(event.point, hitOptions)
        } else {
            hitResult = customMask().hitTestAll(event.point, hitOptions)
        }
        if (hitResult[0] != undefined && hitResult[0].item) {
            hitResult[0].item.selected = true
            selectedObject = hitResult[0]
        } else {
            selectedObject = null
        }
    }


    cutTool.onMouseDown = function (event: paper.ToolEvent) {
        project.activate()
        if (event.item instanceof paper.Path) {
            event.item.remove();

        } else if (event.item != null) {
            const hitOptions = {
                segments: true,
                stroke: true,
                fill: true,
                tolerance: 2
            };
            let hitResult
            if (!state.maskEditingMode) {
                hitResult = clipGroup().hitTestAll(event.point, hitOptions)
            } else {
                hitResult = customMask().hitTestAll(event.point, hitOptions)
            }
            if (hitResult[0] != undefined && hitResult[0].item) {
                const item = hitResult[0];
                let path = (item.item ? item.item : item) as paper.Path
                path.remove();
            }

        }
    }



    fillTool.onMouseDown = function (event: paper.ToolEvent) {
        project.activate()
        if (state.paintbucket.active) {
            if (event.item instanceof paper.Path) {
                let path = event.item
                path.fillColor = state.paintbucket.palette[state.paintbucket.colorName]
                path.strokeColor = "#00000000"

            } else if (event.item != null) {
                const group = project.activeLayer
                let hitInfos = clipGroup().hitTestAll(event.point)
                hitInfos = hitInfos.filter(hi => hi.item && hi.item instanceof paper.Path)
                if (hitInfos.length == 0) return
                const smallest = hitInfos[0]
                let path = (smallest.item ? smallest.item : smallest) as paper.Path
                path.fillColor = state.paintbucket.palette[state.paintbucket.colorName]
                path.strokeColor = "#00000000"
            }
        }
    }

    fillTool.onMouseMove = function (event) {
        project.activate()
        project.activeLayer.selected = false;
        const hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 2
        };
        let hitResult
        if (!state.maskEditingMode) {
            hitResult = clipGroup().hitTestAll(event.point, hitOptions)
        }
        if (hitResult[0] != undefined && hitResult[0].item) {
            hitResult[0].item.selected = true
            selectedObject = hitResult[0]
        } else {
            selectedObject = null
        }
    }

    function rasterize(boundingRect: paper.Rectangle): [ImageData, paper.Group] {
        project.activate()
        const { width: boundWidth, height: boundHeight } = boundingRect
        const layerBgRect = new paper.Path.Rectangle(project.view.bounds)
        layerBgRect.fillColor = '#ffffff'
        const bgRect = new paper.Path.Rectangle(boundingRect)
        bgRect.fillColor = "#ffffff"
        bgRect.sendToBack()
        layerBgRect.sendToBack()

        // scale it so the raster area within the bounds is 256x256
        const [scaleX, scaleY] = [255 / boundWidth, 255 / boundHeight]

        let scaledClippingGroup: paper.Group
        if(customMask().data.isUsed) {
            const overlay = customMask().children['overlay'] as paper.CompoundPath
            const rect = new paper.Path.Rectangle(overlay.bounds)
            const inverted = rect.subtract(overlay)
            scaledClippingGroup = new paper.Group([inverted])
            scaledClippingGroup.remove()

        } else {
            scaledClippingGroup = clipGroup().clone()
            scaledClippingGroup.remove()
        }

        const prevVisble = customMask().visible
        customMask().visible = false

        project.activeLayer.scale(scaleX, scaleY, boundingRect.topLeft)
        // top left corner of bounding rect
        const { x, y } = bgRect.bounds // how far "off the page" the top left corner is
        bgRect.remove()

        // things need a non-transparent fill to be clickable
        // we need to make this transparent before sending to the model
        const unfilledPartsHack = clipGroup().children.filter(c => c.fillColor.alpha < 0.01)
        unfilledPartsHack.forEach(path => {
            path.fillColor = null
        })
        const raster = paper.project.activeLayer.rasterize(72, false)
        unfilledPartsHack.forEach(path => {
            path.fillColor = '#FF000001'
        })
        const pt_topleft = new paper.Point(Math.ceil(scaleX * x),
            Math.ceil(scaleY * y))
        const pt_bottomright = new paper.Size(256, 256)
        layerBgRect.remove()
        customMask().visible = prevVisble
        paper.project.activeLayer.scale(1 / scaleX, 1 / scaleY, boundingRect.topLeft)
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
        if (project.activeLayer.data.empty) {
            emit('canceloutput')
            return
        }
        const canvas: HTMLCanvasElement = paper.view.element
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
        emit('drawoutput', [reply.canvasData, clippingGroup, boundingRect])
    }

    function clear(mask: boolean) {
        project.activate()
        clipGroup().removeChildren()
    }

    function autoMask(){
      project.activate()
      customMask().removeChildren()
      const overlay = new paper.Path.Rectangle(paper.view.bounds.clone())
      customMask().addChild(overlay)
      customMask().data.isUsed = false
      overlay.fillColor = '#0000005F'
      overlay.name = 'overlay'
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        const mirrorLayer = null

        const clippingGroup = new paper.Group()
        clippingGroup.name = 'clippingGroup'

        const customMask = new paper.Group()
        customMask.name = 'customMask'
        const overlay = new paper.Path.Rectangle(paper.view.bounds.clone())
        customMask.addChild(overlay)
        overlay.fillColor = '#0000005F'
        overlay.name = 'overlay'
        //customMask.clipped = true
        customMask.visible = false

        const boundingRectPath = new paper.Path.Rectangle(paper.view.bounds.clone().scale(0.99))
        boundingRectPath.name = 'boundingRect'
        boundingRectPath.strokeColor = '#000000FF'
        boundingRectPath.dashArray = [2, 40]

        const boundingViewGroup = new paper.Group();
        let outsideBounds = new paper.Path.Rectangle(paper.view.bounds.clone().scale(0.99))
        outsideBounds.reverse()
        boundingViewGroup.addChild(outsideBounds);
        boundingViewGroup.addChild(boundingRectPath);
        boundingViewGroup.name = 'boundingViewGroup'

        const boundingViewContainer = new paper.Group();
        boundingViewContainer.name = 'boundingViewContainer'
        boundingViewContainer.addChild(boundingViewGroup);

        const filled = new paper.Path.Rectangle(paper.view.bounds.clone())
        filled.fillColor = "#0000000C"
        boundingViewContainer.addChild(filled);
        boundingViewContainer.clipped = true;

        project.addLayer(layer)
        layer.data.empty = true
        return [project.activeLayer.index, {
            layer, clippingGroup, model: 'edges2shoes_pretrained', mirrorLayer, deleted: false
        }];
    }

    function deleteLayer(idx) {
        project.activate()
        // project.layers.splice(idx, 1);
        project.layers[idx].opacity = 0
        console.log("after",project.layers)
    }

    function switchLayer(idx: number) {
        project.activate()
        project.layers.map((lyr: paper.Layer, i:number) => {
          if(i == 0) return;
          lyr.opacity = 0.2
          if(state.layers[i - 1].deleted){
            lyr.visible = false
          }
        });
        console.log(project.layers, idx);
        project.layers[idx].opacity = 1
        const prevActiveLayer = project.activeLayer
        project.layers[idx].activate()
        if (prevActiveLayer != project.activeLayer) {
            console.log('going back to draw tool')
            prevActiveLayer.children['customMask'].visible = false
            prevActiveLayer.children['boundingViewContainer'].visible = false
            emit('switchTool', 'draw')
        }
        activeBoundsContainer().visible = true
    }

    function swapLayers(idxA: number, idxB: number) {
        const layerA = project.layers[idxA]
        const layerB = project.layers[idxB]
        project.insertLayer(idxA, layerB);
        project.insertLayer(idxB, layerA);
    }

    function switchTool(currenttool:string, tool:string) {

        for (const layer of project.layers) layer.children['boundingViewContainer'].children['boundingViewGroup'].children['boundingRect'].selected = false

        console.log("switch tool", currenttool, tool);
        state.maskEditingMode = false
        customMask().visible = false
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
                if(currenttool === tool){
                  emit("switchTool", "draw");
                } else {
                  state.maskEditingMode = true
                  activeBounds().selected = true
                  boundsEditingTool.activate();
                }
                break;
            case 'mask':
                if(currenttool === tool){
                  emit("switchTool", "draw");
                } else {
                    state.maskEditingMode = true
                    customMask().visible = true
                    drawTool.activate()
                }
                break;
            default:
                //donothing
                break;
        }
    }

    function resetFills() {
        project.activate()
        for (const item of clipGroup().children) {
            if (item instanceof paper.Path) {
                item.fillColor = '#00000001'
                item.strokeColor = '#000000'
            }
        }
    }

    function setMaskToFull(){
      const overlay = customMask().children['overlay'] as paper.CompoundPath
      const rect = new paper.Path.Rectangle(overlay.bounds.clone().scale(.999))
      const result = overlay.subtract(rect)
      overlay.remove()
      result.name = 'overlay'
      customMask().addChild(result)
      customMask().data.isUsed = true
    }


    function resetBounds() {
        project.activate()
        activeBounds().bounds = paper.view.bounds.clone().scale(0.99)
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
        deleteLayer,
        switchTool,
        setState,
        resetBounds,
        resetFills,
        setMaskToFull,
        autoMask
    }
}

type SketchMethods = {
    renderCanvas: () => void,
    clear: (mask: boolean) => void,
    switchLayer: (idx: number) => void,
    swapLayers: (idxA: number, idxB: number) => void,
    addLayer: () => void,
    deleteLayer: (idx: number) => void,
    switchTool: (currenttool:string, tool: string) => void,
    setState: (newState: AppState) => void,
    resetBounds: () => void,
    resetFills: () => void,
    setMaskToFull: () => void,
    autoMask: () => void
}


function setMouseDown(state, emit) {
    state.mouseOnCanvas = true;
    console.log("stat:" + state.mouseOnCanvas);
    emit('render');
}

function setMouseUp(state, emit) {
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
        //newcanvas.setAttribute("resize", "true");
        element.appendChild(newcanvas)

        element.onmousedown = (() => setMouseDown(this.appState, this.emit));
        element.onmouseup = (() => setMouseUp(this.appState, this.emit))

        make_paper(this, newcanvas, element, this.comm, this.emit, this.appState)
        setTimeout(() => this.emit('isConnected'), 1)
        setTimeout(() => this.emit('addLayer'), 20)
        setTimeout(() => {
            for (const modelName of this.comm.available_models()) {
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

function find_next_layer(idx, layers){
    for(let i = idx + 1; i< layers.length; i++){
      if(!layers[i].deleted){
        return i;
      }
    }
    for(let i = idx - 1; i >= 0; i--){
      if(!layers[i].deleted){
        return i;
      }
    }
    return -1;
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
        sketch().clear(state.app.maskEditingMode)
    })

    emitter.on('changeLayer', (layerIdx) => {
        sketch().switchLayer(layerIdx)
        state.app.activeLayer = layerIdx;
        emitter.emit('render')
    })

    emitter.on('addLayer', () => {
        let res = sketch().addLayer()
        state.app.layers.push(res[1]);
        emitter.emit('addLayerMirror', res[0] + 1)
        // emitter.emit('changeLayer');
        emitter.emit('render')
    })

    emitter.on('deleteLayer', (input: [number, boolean]) => {
        let idx = input[0]
        let sel = input[1];
        if (state.app.layers.length < 2) {
            return;
        }
        sketch().deleteLayer(idx + 1)
        state.app.layers[idx].deleted = true;

        emitter.emit('changeLayer', find_next_layer(idx, state.app.layers) + 1);
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
        let prevtool = state.app.tool;
        state.app.tool = tool;
        sketch().switchTool(prevtool, tool)
        console.log(state.app.tool);
        emitter.emit('render');
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

    emitter.on('setMaskToFull', () => {
        sketch().setMaskToFull()
    })

    emitter.on('autoMask', () => {
        sketch().autoMask()
    })

    // TODO: make a comm reducer
    emitter.on('addModel', (modelName) => {
        state.app.availableModels.push(modelName)
    })
}
