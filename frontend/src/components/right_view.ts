import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit, Layer } from './../types'
import html from 'choo/html'
import {mirrorView} from './mirror_component'

const pawprint = require('./../assets/pawprint.svg')
const arrow = require('./../assets/arrow.png')
const dotted = require('./../assets/dotted-square.svg')

function dropdownContent(emit:Emit, layer, i:number, state: AppState){
    return html`<div class="dropdown-content">
      ${state.availableModels.map(modelName =>
        html`<a href="#" onclick=${() => changeModel(state, i, modelName)}>${getName(modelName)}</a>`
      )}
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

//should probably find a nicer way to map model names to their backend namespace later
function getName( model : string){
  let name = "error";
  switch (model){
    case ('edges2cat'):
      name = "Cat"
      break
    case ('edges2handbag'):
      name = "Bag"
      break
    case ('edges2shoes_pretrained'):
      name = "Shoes"
      break
    case ('sat2map_pretrained'):
      name = "Map"
      break
    case ('edges2pikachu'):
      name = "Pikachu"
      break
    default:
      name = model.charAt(0).toUpperCase() + model.slice(1)
      break;
  }
  return name
}

function layer(state: AppState, l: Layer, emit: Emit, i, selected:boolean){
    let modelname = getName(l.model);
    return html`
      <div class="layer ${selected ? 'selected' : ''}" onclick=${() => emit('changeLayer', i + 1)}>${"layer " + (i + 1)}
      <div class="dropdown"> ${modelname} ${dropdownContent(emit, l, i, state)}</div>
      <img src=${dotted} alt="bounding button"/>
      </div>`
}

export function rightView(state: choo.IState, emit: Emit) {
    return html`  
<div id="rest">

        <div id="middle" class="column">
        ${layerBuilder(state.app, emit)}
    </div>
    <div id="right" class="column">
      ${mirrorView(state, emit)}
    </div>
    </div>`
}
