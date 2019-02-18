import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {mirrorView} from './mirror_component'


function layerBuilder(state: AppState, emit: Emit) {
    const layers = state.layers.map((l, i) => {
        return html`${layer(state, emit, i)}`;
    })
    //!state.app.server.isConnected
    return html`
    <div id="layers">
        <ul id="layer-menu">
        <li class="menu-item"><p>${state.activeLayer}</p></li>
        <li class="menu-item"><button onclick=${() => emit('addLayer')}>+</button></li>
        <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setSmoothness', srcElement.checked)} name="smooth">
        <label for="smooth">smooth</label>
        </li>
        <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setClosed', srcElement.checked)} name="closed" checked>
        <label for="closed">closed</label>
        </li>
        ${layers}
        </ul>
    </div>`
}

function layer(state: AppState, emit: Emit, i){
    return html`
    <li class="menu-item">
    <button onclick=${() => emit('changeLayer', i + 1)}>Layer ${i + 1}
    </button>
    </li>`
}

export function rightView(state: choo.IState, emit: Emit) {
    return html`
    <div id="right">
        ${mirrorView(state, emit)}
        ${layerBuilder(state.app, emit)}
    </div>`
}