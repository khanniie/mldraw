import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const heart = require('./../assets/heart.svg')
const render = require('./../assets/render.png')

export function drawView(state: choo.IState, emit: Emit) {
      const onclick = () => emit('mlrender')
    return html`
    <div class="cutebox">
        <div class="cutebox_info"><img src=${heart}/> drawing view <div class="mode">${return_mode(state)}</div></div>
        <div id="paper">${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
          <div id="render" onclick=${onclick} class=${state.app.mouseOnCanvas ? "disappear unselectable" : "unselectable"}>
            ${renderButton(state.app.renderdone)}
            <div class="tooltip-container"><div class="tooltip"><p>render layer</p></div></div>
          </div>
          ${bottom_buttons(state, emit)}
        </div>
    </div>
    `
}

function return_mode(state){
  switch(state.app.tool){
    case "bounds":
      return "bounds editing mode"
    case "mask":
      return "custom masking mode"
    default:
      return "drawing mode"
  }
}

function bottom_buttons(state, emit){
  if(state.app.tool === "mask" && state.app.automask){
    return html`
    <div id="canvas_button_container">
      ${optionButton(()=>emit('customMask'), "switch to custom mask mode", state)}
    </div>`
  } else if (state.app.tool === "mask" && !state.app.automask){
    return html`
    <div id="canvas_button_container">
      ${optionButton(()=>emit('setMaskToFull'), "set mask bounds to full canvas", state)}
      ${optionButton(()=>emit("autoMask"), "switch to automask using drawing", state)}
    </div>`
  } else if(state.app.tool === "bounds"){
    return html`
    <div id="canvas_button_container">
      ${optionButton(()=>emit("resetBounds"), "reset bounds", state)}
    </div>`
  }
}

function optionButton(click_funct, title, state){
    return html`
        <button
          class=${state.app.mouseOnCanvas ? "canvas_button disappear unselectable" : "canvas_button unselectable"}
          onclick=${click_funct}>
            ${title}
        </button>
    `
}

function renderButton(renderd) {
    return html`
        <img id="render-img" src=${render} class=${renderd ? ``: `spin`} />
    `
}
