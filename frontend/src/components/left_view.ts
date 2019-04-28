import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {drawView} from './drawing_component'
import {modelPalettes} from "../model-palettes"
import * as filesaver from 'file-saver'

import { rightView } from './right_view'

const logo = require('./../assets/logo.png')
const toolbar = require('./../assets/toolbar-naked.png')
const paintbucket = require('./../assets/bucket.svg')
const paintbucket_s = require('./../assets/bucket-selected.svg')
const eraser = require('./../assets/eraser.svg')
const eraser_s = require('./../assets/eraser-selected.svg')
const pencil = require('./../assets/pencil.svg')
const pencil_s = require('./../assets/pencil-selected.svg')
const undo = require('./../assets/undo.png')
const transform = require('./../assets/transform.svg')
const transform_s = require('./../assets/transform-selected.svg')
const trash = require('./../assets/bomb.svg')
const more = require('./../assets/more.png')
const clip = require('./../assets/hammer.svg')
const download = require('./../assets/download.svg')

function tool_use_sel(tool_name, active_tool, usable){
  let cla = "icon";
  if(tool_name === active_tool) {cla += " selected-icon"}
  if(!usable) {cla += " no_use"}
  return cla;
}

function topBar(state: AppState, emit: Emit) {

  const saveImg = () => {
    var mirror_canvas = document.getElementById("mirror-canvas-element");
    var p5_canvas = document.getElementById("p5-canvas");
    var new_canvas = document.createElement("CANVAS");

    var can_wid = mirror_canvas.width;
    var can_hei = mirror_canvas.height;

    new_canvas.width = can_wid;
    new_canvas.height = can_hei;

    var ctx = new_canvas.getContext('2d');

    ctx.drawImage(mirror_canvas, 0, 0, can_wid, can_hei);

    new_canvas.toBlob(function(blob) {
      filesaver.saveAs(blob, "mldraw-output.png");
    });
  }
    return html`
    <div id="bar">
        <div id="toolbar">
        <div id="bar-info">
        <div id="bar-info" class="cutebox_info">
            <img src=${clip}/>
            tools
        </div></div>
        <div id="icons">
            <div class="icon" onclick=${saveImg}>
              <img src="${download}"/>
              <div class="tooltip-container"><div class=tooltip><p>download</p></div></div>
            </div>
            <div class=${state.tool == "drag" ? "selected-icon icon" : "icon"} onclick=${() => emit('switchTool', 'drag')}>
              <img src="${state.tool == "drag" ? transform_s : transform}">
              <div class="tooltip-container"><div class=tooltip><p>drag/edit</p></div></div>
            </div>
            <div class="icon" onclick=${() => emit('clear')}>
              <img src="${trash}">
              <div class="tooltip-container"><div class=tooltip><p>clear layer</p></div></div>
            </div>
            <div class= "icon" onclick=${() => emit('switchTool', 'cut')}>
              <img src="${state.tool == "cut" ? eraser_s : eraser}"/>
              <div class="tooltip-container"><div class=tooltip><p>erase</p></div></div>
            </div>
            <div id="paintbucket-icon" class=${tool_use_sel("fill", state.tool, state.paintbucket.usable)} onclick=${() => emit('paintbucketclicked')}>
              <span id="paintbucketInfo" class=${state.paintbucket.usable ? "p-info-use" : ''}>
                ${state.paintbucket.usable ? state.paintbucket.colorName : ''}
              </span>
              <img src="${state.tool == "fill" ? paintbucket_s : paintbucket}">
              <div class="tooltip-container"><div class=tooltip><p>fill shapes</p></div></div>
              <div class="palette">${palette(emit, state)}</div>
            </div>
            <div class=${state.tool == "draw" ? "selected-icon icon" : "icon"} id="dropdown-s">
              <img onclick=${() => emit('switchTool', 'draw')} src="${state.tool == "draw" ? pencil_s : pencil}"/>
              <div id="colorpick">
                <input id="colorpick-i" type="color" onchange=${e => emit('setStrokeColor', e.target.value)} name="colorpicker" value=${state.strokeColor}/>
                <div id="colorpick-display" style="background-color:${state.strokeColor};">
                </div>
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

function palette(emit: Emit, state: AppState) {

    if(state.layers.length < 1) return;

    const model_palette = modelPalettes[state.layers[state.activeLayer - 1].model]
    if(model_palette == null) return;

    console.log(model_palette)

    const model_dom = Object.keys(model_palette).map((l, i) => {
        return html`${palette_element(emit, state, l, model_palette, i)}`;
    })

    return model_dom;
}

function palette_element(emit, state, ele_key, arr, idx){
  const onclick = (() => {
    state.paintbucket.colorIdx = idx
    state.paintbucket.colorName = Object.keys(state.paintbucket.palette)[idx]
    emit('switchTool', 'fill')
    emit('setFill', palette[state.app.paintbucket.colorName])
    emit('render')
  })

  if(state.paintbucket.colorName === ele_key){
    return html`
        <div onclick=${onclick} class="palette-element current">
          <div class="pal-ele-col" style="background-color:${arr[ele_key]};"></div>
          ${ele_key}
        </div>
    `
  } else {
    return html`
        <div onclick=${onclick} class="palette-element">
          <div class="pal-ele-col" style="background-color:${arr[ele_key]};"></div>
          ${ele_key}
        </div>
    `
  }
}

export function leftView(state: choo.IState, emit: Emit) {
    return html`
    <div>
    <div class="column">
    ${topBar(state.app, emit)}
    ${rightView(state, emit)}
    </div>
    <div class="column">
    ${drawView(state, emit)}
    </div></div>`
}
