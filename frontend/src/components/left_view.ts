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
const trash = require('./../assets/trash.png')
const close = require('./../assets/close.svg')
const more = require('./../assets/more.png')

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
              </div>
              <div class="dropdown-content-settings">
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
            </div></div>
            <div class=${state.tool == "cut" ? "selected-icon icon" : "icon"}>
              <img src="${eraser}" onclick=${() => emit('switchTool', 'cut')}/>
            </div>
            <div class=${state.tool == "paintbucket" ? "selected-icon icon" : "icon"}>
              <span id="paintbucketInfo">${state.paintbucket.active ? state.paintbucket.colorName : ''}</span>
              <img onclick=${() => emit('paintbucketclicked')} src="${paintbucket}">
            </div>
            <div class="icon">
              <img src="${undo}">
            </div>
            <div class=${state.tool == "drag" ? "selected-icon icon" : "icon"}>
              <img onclick=${() => emit('switchTool', 'drag')} src="${transform}">
            </div>
            <div class="icon">
              <img onclick=${() => emit('clear')} src="${trash}">
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
    <div id="left" class="column">
        ${drawView(state, emit)}
        ${topBar(state.app, emit)}
    </div>`
}
