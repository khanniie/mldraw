import { State, Emitter } from "./types";

// TODO: put this in a JSON where it is loaded with the model
export const modelPalettes = {
    facades: {
        background: "#0006d9",
        wall: "#0d3dfb",
        door: "#a50000",
        "window": "#0075ff",
        "window sill": "#68f898",
        "window head": "#1dffdd",
        shutter: "#eeed28",
        balcony: "#b8ff38",
        trim: "#ff9204",
        cornice: "#ff4401",
        column: "#f60001",
        entrance: "#00c9ff",

    }
}

export function paintBucketStore(state: State, emitter: Emitter) {
    emitter.on('changeLayer', (layerIdx) => {
        const activeLayer = state.app.layers[layerIdx - 1]
        if(activeLayer != null && activeLayer.model in modelPalettes) {
            const palette = modelPalettes[activeLayer.model]
            state.app.paintbucket.active = true
            state.app.paintbucket.palette = palette
            state.app.paintbucket.colorIdx = 0
            state.app.paintbucket.colorName = Object.keys(modelPalettes[activeLayer.model])[0]
            emitter.emit('setFill', palette[state.app.paintbucket.colorIdx])
        } else {
            state.app.paintbucket.active = false;
            emitter.emit('setFill', false)
        }
        emitter.emit('render')
    })
    emitter.on('paintbucketclicked', () => {
        if(!state.app.paintbucket.active) {
            console.error('paint bucket deactivated but still got click :/')
        } else if(!(state.app.layers[state.app.activeLayer - 1].model in modelPalettes)) {
            console.error(`no palette for model ${state.app.layers[state.app.activeLayer - 1].model} known`)
        }else {
            const palette = state.app.paintbucket.palette;
            const totalColors = Object.keys(palette)
            state.app.paintbucket.colorIdx = (state.app.paintbucket.colorIdx + 1) % totalColors.length;
            state.app.paintbucket.colorName = totalColors[state.app.paintbucket.colorIdx]
            emitter.emit('switchTool', 'fill')
            emitter.emit('setFill', palette[state.app.paintbucket.colorName])
        }
    })
}
