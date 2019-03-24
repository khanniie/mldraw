import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {drawView} from './drawing_component'

const logo = require('./../assets/logo.png')
const toolbar = require('./../assets/toolbar-naked.png')
const paintbucket = require('./../assets/paintbucket.png')
const eraser = require('./../assets/eraser.png')
const pencil = require('./../assets/pencil.png')
const undo = require('./../assets/undo.png')
const transform = require('./../assets/transform.png')
const trash = require('./../assets/clear.png')
const close = require('./../assets/gift-box.svg')
const more = require('./../assets/more.png')

function tool_use_sel(tool_name, active_tool, usable){
  console.log(tool_name, active_tool, usable);
  let cla = "icon";
  if(tool_name === active_tool) {cla += " selected-icon"}
  if(!usable) {cla += " no_use"}
  return cla;
}

function topBar(state: AppState, emit: Emit) {
    return html`
    <div id="bar">
        <div id="toolbar">
        <div id="bar-info">
        <div id="bar-info" class="cutebox_info">
            <img src=${close}/>
            tools
        </div></div>
        <div id="icons">
            <div class=${state.tool == "draw" ? "selected-icon icon" : "icon"} id="dropdown-s">
              <img onclick=${() => emit('switchTool', 'draw')} src="${pencil}"/>
              <div id="colorpick">
              <input id="colorpick-i" type="color" onchange=${e => emit('setStrokeColor', e.target.value)} name="colorpicker" value=${state.strokeColor}/>
              <div id="colorpick-display" style="background-color:${state.strokeColor};">
              </div></div>
              <div class="dropdown-content-settings">
              <p>draw tool settings</p>
              <ul>
                       <li class="menu-item">
                       <input type="checkbox" onclick=${({srcElement}) => emit('setSmoothness', srcElement.checked)} name="smooth" ${state.smoothing ? 'checked' : ''}/>
                       <label for="smooth"> smooth</label>
                       </li>
                       <li class="menu-item">
                       <input type="checkbox" onclick=${({srcElement}) => emit('setClosed', srcElement.checked)} name="closed" ${state.closed ? 'checked' : ''}/>
                       <label for="closed"> closed</label>
                       </li>
              </ul>
              </div>
            </div>
            <div class=${state.tool == "cut" ? "selected-icon icon" : "icon"} onclick=${() => emit('switchTool', 'cut')}>
              <img src="${eraser}"/>
              <div class="tooltip-container"><div class=tooltip>erase</div></div>
            </div>
            <div class=${tool_use_sel("fill", state.tool, state.paintbucket.usable)} onclick=${() => emit('paintbucketclicked')}>
              <span id="paintbucketInfo" class=${state.paintbucket.usable ? "p-info-use" : ''}>
                ${state.paintbucket.usable ? state.paintbucket.colorName : ''}
              </span>
              <img src="${paintbucket}">
              <div class="tooltip-container"><div class=tooltip>fill shapes</div></div>
            </div>
            <div class=${state.tool == "drag" ? "selected-icon icon" : "icon"} onclick=${() => emit('switchTool', 'drag')}>
              <img src="${transform}">
              <div class="tooltip-container"><div class=tooltip>drag/edit lines</div></div>
            </div>
            <div class="icon" onclick=${() => emit('clear')}>
              <img src="${trash}">
              <div class="tooltip-container"><div class=tooltip>clear layer</div></div>
            </div>
        </div>
        </div>
    </div>`
}

function clearButton(emit: Emit) {
    const onclick = () => emit('clear')
    return html`
        <button onclick=${onclick}>clear</button>
    `
}

export function leftView(state: choo.IState, emit: Emit) {
    return html`
    <div class="inside-column">
        ${drawView(state, emit)}
        ${topBar(state.app, emit)}
    </div>`
}
