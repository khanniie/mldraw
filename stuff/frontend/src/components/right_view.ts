import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {mirrorView} from './mirror_component'


function dropdownContent(emit:Emit, layer, i:number, state){
    return html`<div class="dropdown-content">
     <a href="#" onclick=${() => changeModel(state, i, 'edges2cat')}>Cat</a>
     <a href="#" onclick=${() => changeModel(state, i, 'edges2handbag')}>Handbag</a>
     <a href="#" onclick=${() => changeModel(state, i, 'edges2shoes_pretrained')}>Shoe</a>
     <a href="#" onclick=${() => changeModel(state, i, 'map2sat_pretrained')}>Map</a>
     <a href="#" onclick=${() => changeModel(state, i, 'edges2pikachu')}>Pikachu</a>
   </div>`;
  }
  
  function changeModel(appState:AppState, idx, model){
    appState.layers[idx].model = model;
    console.log("model changed idx: ", idx);
    console.log('current state', appState);
  }

function layerBuilder(state: AppState, emit: Emit) {
    const layers = state.layers.map((l, i) => {
        let name = (i + 1) == state.activeLayer ? 'SELtECTED Layer' + (i + 1) : 'Layer' + (i + 1);
        return html`${layer(state, emit, i, name)}`;
    })
    //!state.app.server.isConnected
    return html`
    <div id="layers">

        <ul id="layer-menu">
        <div class="cutebox_info layer_info">
        <p>Layer Info</p>
        <li class="menu-item"><p>${state.activeLayer}</p></li>
        <li class="menu-item"><button onclick=${() => emit('addLayer')}>+</button></li>
        <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setSmoothness', srcElement.checked)} name="smooth">
        <label for="smooth">smooth</label>
        </li>
        <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setClosed', srcElement.checked)} name="closed" checked>
        <label for="closed">closed</label>
        </li>
        </div>
        <div>
        ${layers}
        </div>
        </ul>
    </div>`
}

function layer(state: AppState, emit: Emit, i, name){
    return html`
    <div class="layer" onclick=${() => emit('changeLayer', i + 1)}>${name}
    <div class="dropdown"> models ${dropdownContent(emit, layer, i, state)}</div>
    </div>`
}

export function rightView(state: choo.IState, emit: Emit) {
    return html`
    <div id="right">
        ${mirrorView(state, emit)}
        ${layerBuilder(state.app, emit)}
    </div>`
}