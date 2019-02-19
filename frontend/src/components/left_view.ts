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
const more = require('./../assets/settings-work-tool.svg')

function topBar(state: AppState, emit: Emit) {
    return html`
    <div id="bar">
        <div id="toolbar">
        <div id="bar-info-container">
        <div id="bar-info" class="cutebox_info">
            <img src=${close}/>
            tools
        </div></div>
        <div id="icons">
            <img onclick=${() => emit('switchTool', 'draw')} src="${pencil}">
            <img src="${eraser}">
            <img onclick=${() => state.paintbucket.active ? emit('paintbucketclicked') : void''} 
                src="${paintbucket}" style=${state.paintbucket.active ? '""' : "opacity:50%"}>
            <img src="${undo}">
            <img onclick=${() => emit('switchTool', 'drag')} src="${transform}">
            <img onclick=${() => emit('clear')} src="${trash}">
            <img src="${more}">
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
    <div id="left">
        <img id="cat" src=${logo}/>
        ${drawView(state, emit)}
        ${topBar(state.app, emit)}
    </div>`
}