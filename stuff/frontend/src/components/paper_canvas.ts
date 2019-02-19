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
    emit: Emit) => {
    const project = new paper.Project(canvas)
    console.log('papercanvas', project)
    let background = new paper.Layer(); //background
    background.activate()
    background.name = 'background'
    const {width: viewWidth, height: viewHeight} = paper.project.view.bounds
    let rec = new paper.Rectangle(0, 0, background.bounds.width, background.bounds.height)
    let path_rec = new paper.Path.Rectangle(rec)
    path_rec.fillColor = '#ffffff'
    project.addLayer(background)
    
    let fill = false;
    let fillColor: string;
    let smoothing = false;
    let autoclose = true;
    let dragTool = new paper.Tool();
    let drawTool = new paper.Tool();
    let fillTool = new paper.Tool();
    drawTool.activate();

    console.log(paper)
    var pathBeingDrawn: paper.Path
    addLayer()

    drawTool.onMouseDown = function (event) {
        project.activate()
        if(selectedObject) return;
        pathBeingDrawn = new paper.Path({
            segments: [event.point],
            strokeColor: 'black',
            fullySelected: true,
            name: 'temp'
        })
        pathBeingDrawn.closed = autoclose

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
        pathBeingDrawn.fillColor = "#FF000001"
        if(smoothing) pathBeingDrawn.simplify(10);
        //console.log(project.activeLayer.name, project.layers)
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

      	// if (event.modifiers.shift) {
      	// 	if (selectedObject.type == 'segment') {
        //     console.log("shifting");
      	// 		selectedObject.segment.remove();
      	// 	};
      	// 	return;
      	// }

    		path = selectedObject.item
    		if (selectedObject.type == 'segment') {
    			segment = selectedObject.segment;
    		} else if (selectedObject.type == 'stroke') {
    			var location = selectedObject.location;
          console.log("location: ", location.index, event.point);
    			segment = path.insert(location.index + 1, event.point);
    		}

      	// movePath = selectedObject.type == 'fill';
      	// if (movePath)
      	// 	project.activeLayer.addChild(selectedObject.item);
    }

    dragTool.onMouseMove = function(event) {
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

    fillTool.onMouseDown = function(event: paper.ToolEvent) {
        project.activate()
        if(fill) {
            if(event.item instanceof paper.Path) {
                let path = event.item
                path.fillColor = fillColor
                path.strokeColor = "#00000000"
    
            } else if(event.item != null) {
                const group = event.item
                let hitInfos = group.hitTestAll(event.point)
                hitInfos = hitInfos.filter(hi => hi.item && hi.item instanceof paper.Path)
                if(hitInfos.length == 0) return
                const smallest = hitInfos[0]
                let path = (smallest.item ? smallest.item : smallest) as paper.Path
                path.fillColor = fillColor
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



    function rasterize():  [ImageData, paper.Group] {
        project.activate()
        const {x: unscaledX, y: unscaledY, width, height} = paper.project.activeLayer.bounds // how far "off the page" the top left corner is
        const {width: viewWidth, height: viewHeight} = paper.project.view.bounds
        const bgRect = new paper.Path.Rectangle(new paper.Rectangle(Math.min(0, unscaledX), Math.min(unscaledY, 0), 
            Math.max(width, viewWidth), Math.max(height, viewHeight)))
        bgRect.fillColor = "#ffffff"
        bgRect.sendToBack()
        paper.project.activeLayer.scale(255/viewWidth, 255/viewHeight, new paper.Point(0, 0))
        const {x, y} = paper.project.activeLayer.bounds // how far "off the page" the top left corner is
        const scaledClippingGroup: paper.Group = paper.project.activeLayer.children['clippingGroup'].clone()
        scaledClippingGroup.remove()
        const raster = paper.project.activeLayer.rasterize(72, false)

        const pt_topleft = new paper.Point(Math.ceil(-x), Math.ceil(-y))
        const pt_bottomright = new paper.Size(256, 256)
        bgRect.remove()
        paper.project.activeLayer.scale(viewWidth/255, viewHeight/255, new paper.Point(0, 0))
        return [raster.getImageData(new paper.Rectangle(pt_topleft, pt_bottomright)), scaledClippingGroup]
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
        const [raster, clippingGroup] = rasterize()
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
        emit('drawoutput', [reply.canvasData, clippingGroup])
        console.log("active layer AFTER", project.activeLayer);

    }

    function clear() {
        project.activate()
        project.activeLayer.children['clippingGroup'].removeChildren()
    }

    function addLayer() {
        project.activate()
        const layer = new paper.Layer()
        const clippingGroup = new paper.Group()
        const mirrorLayer = null
        clippingGroup.name = 'clippingGroup'
        project.addLayer(layer)
        return {
            layer, clippingGroup, model: 'edges2shoes_pretrained', mirrorLayer
        }
    }

    function switchLayer(idx: number) {
        project.activate()
        project.layers[idx].activate()
        console.log("active layer:", project.activeLayer);
    }

    function swapLayers(idxA: number, idxB: number) {
        const layerA = project.layers[idxA]
        const layerB = project.layers[idxB]
        project.insertLayer(idxA, layerB);
        project.insertLayer(idxB, layerA);
    }

    function setSmoothing(smooth: boolean) {
        smoothing = smooth
    }

    function setClosed(closed: boolean) {
        autoclose = closed
    }

    function switchTool(tool){
        switch (tool) {
            case 'drag':
                dragTool.activate();
                break;
            case 'draw':
                drawTool.activate();
                break;
            case 'fill':
                fillTool.activate();
                break;
            default:
                //donothing
                break;
        }
    }

    function setFill(color: string | boolean) {
        if(color == false) {
            fill = false
        } else if (color == true) {
            throw new Error('invalid argument!')
        } else {
            fill = true
            fillColor = color
        }
    }



    component.sketch = {
        renderCanvas,
        clear,
        switchLayer,
        swapLayers,
        addLayer,
        setSmoothing,
        setClosed,
        switchTool,
        setFill
    }
}

type SketchMethods = {
    renderCanvas: () => void,
    clear: () => void,
    switchLayer: (idx: number) => void,
    swapLayers: (idxA: number, idxB: number) => void,
    addLayer: () => void,
    setSmoothing: (smooth: boolean) => void,
    setClosed: (closed: boolean) => void,
    switchTool: (tool: string) => void,
    setFill: (color: string | boolean) => void // false = don't fill
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

        make_paper(this, newcanvas, element, this.comm, this.emit)
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
        state.app.layers.push(state.cache(PaperCanvasComponent, 'paper-canvas').sketch.addLayer())
        emitter.emit('render')
    })

    emitter.on('setSmoothness', smooth => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setSmoothing(smooth)
    })

    emitter.on('setClosed', close => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setClosed(close)
    })

    emitter.on('switchTool', (tool) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.switchTool(tool)
    })

    emitter.on('setFill', (color) => {
        state.cache(PaperCanvasComponent, 'paper-canvas').sketch.setFill(color)
    })

    // TODO: make a comm reducer
    emitter.on('addModel', (modelName) => {
        state.app.availableModels.push(modelName)
    })

}
