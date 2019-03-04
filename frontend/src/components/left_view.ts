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
            <img class="icon" onclick=${() => emit('switchTool', 'draw')} src="${pencil}">
            <img class="icon" src="${eraser}" onclick=${() => emit('switchTool', 'cut')}">
            <span id="paintbucketInfo">${state.paintbucket.active ? state.paintbucket.colorName : ''}</span>
            <img class="icon" onclick=${() => emit('paintbucketclicked')} src="${paintbucket}">
            <img class="icon" src="${undo}">
            <img class="icon" onclick=${() => emit('switchTool', 'drag')} src="${transform}">
            <img class="icon" onclick=${() => emit('clear')} src="${trash}">
            <div class="icon" id="dropdown-s"><img src="${more}">
            <div class="dropdown-content-settings">
            <ul>
                     <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setSmoothness', srcElement.checked)} name="smooth">
                     <label for="smooth">smooth</label>
                     </li>
                     <li class="menu-item"><input type="checkbox" onclick=${({srcElement}) => emit('setClosed', srcElement.checked)} name="closed" checked>
                     <label for="closed">closed</label>
                     </li>
            </ul>
            </div></div>
        </div>
        </div>
    </div>`
}

// <li class="menu-item">${renderButton(emit)}</li>
// <li class="menu-item">${clearButton(emit)}</li>

// function serverSelector({ address }: AppState['server'], emit: Emit) {
//     const onsubmit = (e: Event) => {
//         e.preventDefault()
//         const form = e.currentTarget as HTMLFormElement
//         const body = new FormData(form)
//         const url = body.get("serverURL")
//         emit('setURL', url.toString())
//     }
//     return html`
//     <form onsubmit=${onsubmit}>
//         <input name="serverURL" type="url" placeholder="Backend server URL" value=${address}>
//         <button type="submit">Connect</button>
//     </form>
//     `
// }

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
