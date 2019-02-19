import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit, Layer } from './../types'
import html from 'choo/html'
import {mirrorView} from './mirror_component'

const pawprint = require('./../assets/pawprint.svg')

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

function showDropdown(event){
  var targetElement = event.target || event.srcElement;
  targetElement.classList.toggle("display-content");
}

function layerBuilder(state: AppState, emit: Emit) {
    const layers = state.layers.map((l, i) => {
        return html`${layer(state, l, emit, i, (i + 1) == state.activeLayer)}`;
    })
    //!state.app.server.isConnected
    return html`
    <div id="layers">
        <ul id="layer-menu">
        <div class="layer_info_container">
        <div class="cutebox_info layer_info"><img src=${pawprint}>layer info
            <button onclick=${() => emit('addLayer')} id="add">add</button>
        </div></div>
        <div class="layer-container">
        ${layers}
        </div>
        </ul>
    </div>`
}

//should probably find a nicer way to map mdoel names to their backend namespace later

function getName( model : string){
  console.log(model);
  let name = "error";
  switch (model){
    case ('edges2cat'):
      name = "cat"
      break
    case ('edges2handbag'):
      name = "bag"
      break
    case ('edges2shoes_pretrained'):
      name = "shoes"
      break
    case ('map2sat_pretrained'):
      name = "map"
      break
    case ('edges2pikachu'):
      name = "pikachu"
      break
    default:
      name = "error"
      break;
  }
  return name
}

// <li class="menu-item"><p>${state.activeLayer}</p></li>
//         <li class="menu-item"><button onclick=${() => emit('addLayer')}>+</button></li>
//         <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setSmoothness', srcElement.checked)} name="smooth">
//         <label for="smooth">smooth</label>
//         </li>
//         <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setClosed', srcElement.checked)} name="closed" checked>
//         <label for="closed">closed</label>
//         </li>

function layer(state: AppState, l: Layer, emit: Emit, i, selected:boolean){
    console.log(l);
    let modelname = getName(l.model);
    if (selected){
      return html`
      <div class="layer selected" onclick=${() => emit('changeLayer', i + 1)}>${"layer " + (i + 1)}
      <div class="dropdown"> ${modelname} ${dropdownContent(emit, l, i, state)}</div>
      </div>`
    } else {
      return html`
      <div class="layer" onclick=${() => emit('changeLayer', i + 1)}>${"layer " + (i + 1)}
      <div class="dropdown"> ${modelname} ${dropdownContent(emit, l, i, state)}</div>
      </div>`
    }

}

export function rightView(state: choo.IState, emit: Emit) {
    return html`
    <div id="right">
        ${mirrorView(state, emit)}
        ${layerBuilder(state.app, emit)}
    </div>`
}
