import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit, Layer, Emitter } from './../types'
import html from 'choo/html'
import {mirrorView} from './mirror_component'
import { emit } from 'cluster';
import { modelPalettes } from '../model-palettes'

const pawprint = require('./../assets/layers.svg')
const arrow = require('./../assets/arrow.png')
const dotted = require('./../assets/dotted-square.svg')
const dotted_selected = require('./../assets/dotted-square-s.svg')
const mask = require('./../assets/mask.png')
const mask_selected = require('./../assets/mask-using.png')
const trash = require('./../assets/garbage.svg')
const info = require('./../assets/info.svg')

function dropdownContent(emit:Emit, layer, i:number, state: AppState, l:Layer){

  return html`<div class="dropdown-content">
      ${state.availableModels.map(modelName =>
        html`<a href="#"
        class=${(l.model === modelName) ? "current" : ""}
        onclick=${() => changeModel(state, i, modelName, emit)}>${getName(modelName)}
        <img src=${info} alt="info button" onclick=${() =>
          (state.overlay = modelName, emit('render'))}/>
        </a>`
      )}
   </div>`;
  }

function changeModel(appState:AppState, idx, model, emit: Emit){
  console.log("CHANGE MODEL");
  const oldModel = appState.layers[idx].model
  if(model != oldModel) {
    if(appState.warningAccepted) {
      emit('resetFills')
    } else {
      emit('showModelChangeWarning')
    }
  }
  appState.layers[idx].model = model;
  console.log("model changed idx: ", idx);
  console.log('current state', appState);
  emit('render');
}

function showDropdown(event){
  var targetElement = event.target || event.srcElement;
  targetElement.classList.toggle("display-content");
}

function layerBuilder(state: AppState, emit: Emit) {
    const valid_layers = (state.layers).filter((l) => !(l.deleted))
    const layers = state.layers.map((l, i) => {
      if(l.deleted){
        return html``;
      } else {
        return html`${layer(state, l, emit, i, (i + 1) == state.activeLayer, valid_layers.length == 1)}`;
      }
    })
    //!state.app.server.isConnected
    return html`
    <div id="layers">
        <ul id="layer-menu">
        <div class="layer_info_container">
        <div class="cutebox_info layer_info"><img src=${pawprint}>layers
            <button onclick=${() => emit('addLayer')} id="add">add layer</button>
        </div></div>
        <div class="layer-container">
        ${layers.reverse()}
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

function layer(state: AppState, l: Layer, emit: Emit, i:number, selected:boolean, singularlayer:boolean){
    let modelname = getName(l.model);
    return html`
      <div class="layer unselectable ${selected ? 'selected' : ''}" onclick=${() => emit('changeLayer', i + 1)}>
        <div class="title"> ${(i + 1) + " "}
        <div class="dropdown"> <span>${modelname}</span> ${dropdownContent(emit, l, i, state, l)}</div></div>
        <img src=${(state.tool === "mask") ? mask_selected : mask}
          onclick=${(e) => {emit('switchTool', 'mask');
                          e.stopPropagation();}}
          alt="mask"/>
        <img src=${(state.tool === "bounds") ? dotted_selected : dotted}
          onclick=${(e) => {emit('switchTool', 'bounds');
                        e.stopPropagation();}}
           alt="bounding button"/>
        <img src=${trash} style=${singularlayer ? "display: none" : ""}
          onclick=${(e) => {emit('deleteLayer', [i, selected]);
                        e.stopPropagation();}}
           alt="trash button"/>
      </div>`
}

export function rightView(state: choo.IState, emit: Emit) {
    return html`
    <div class="inside-column">
        ${layerBuilder(state.app, emit)}
    </div>`
}


export function rightViewStore(state: State, emitter: Emitter) {
  // todo change this to actually show box to accept warning
  // that changing a model will reset the fills
  emitter.on('showModelChangeWarning', () => {
    state.app.warningAccepted = true
  })
}
