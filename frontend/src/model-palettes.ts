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

    },
    colorize: {
        red: '#ff0000',
        green: '#00ff00',
        blue: '#0000ff'
    }
}

export function paintBucketStore(state: State, emitter: Emitter) {
    emitter.on('changeLayer', (layerIdx) => {
        if(!state.app.paintbucket.active) return

        const activeLayer = state.app.layers[layerIdx - 1]
        // switching to layer without palette
        if(activeLayer != null && !(activeLayer.model in modelPalettes)) {
            emitter.emit('setFill', false)
            emitter.emit('switchTool', 'draw')
            emitter.emit('render')
        } else {
            if(modelPalettes[activeLayer.model] != state.app.paintbucket.palette) {
                state.app.paintbucket.palette = modelPalettes[activeLayer.model]
                state.app.paintbucket.colorIdx = 0
                state.app.paintbucket.colorName = ''
            }
        }
    })
    emitter.on('paintbucketclicked', () => {
        // if not yet active, activate if palette, otherwise do nothing
        if(!state.app.paintbucket.active) {
            const hasPalette = state.app.layers[state.app.activeLayer - 1].model in modelPalettes
            if(hasPalette) {
                state.app.paintbucket.active = true;
                // if palette changed
                if(!(modelPalettes[state.app.layers[state.app.activeLayer - 1].model] == state.app.paintbucket.palette)) {
                    state.app.paintbucket.palette = modelPalettes[state.app.layers[state.app.activeLayer - 1].model]
                    state.app.paintbucket.colorIdx = 0
                    state.app.paintbucket.colorName = Object.keys(state.app.paintbucket.palette)[0]    
                }
                emitter.emit('switchTool', 'fill')
                emitter.emit('setFill', state.app.paintbucket.palette[state.app.paintbucket.colorName]) 
                emitter.emit('render')
            } else {
                state.app.paintbucket.active = false;
            }
        } else {
            const palette = state.app.paintbucket.palette;
            const totalColors = Object.keys(palette)
            state.app.paintbucket.colorIdx = (state.app.paintbucket.colorIdx + 1) % totalColors.length;
            state.app.paintbucket.colorName = totalColors[state.app.paintbucket.colorIdx]
            emitter.emit('switchTool', 'fill')
            emitter.emit('setFill', palette[state.app.paintbucket.colorName])
            emitter.emit('render')
        }
    })
    // if switching away from paintbucket, deactivate
    emitter.on('switchTool', tool => {
        if(tool != 'fill') {
            state.app.paintbucket.active = false;
            emitter.emit('render')
        }
    })
}
