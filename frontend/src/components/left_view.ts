import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {drawView} from './drawing_component'

const cat = require('./../assets/cat.png')
const toolbar = require('./../assets/toolbar-naked.png')
const render = require('./../assets/render.png')
const paintbucket = require('./../assets/paintbucket.png')
const eraser = require('./../assets/eraser.png')
const pencil = require('./../assets/pencil.png')
const transform = require('./../assets/transform.png')
const trash = require('./../assets/trash.png')

function topBar(state: AppState, emit: Emit) {
    return html`
    <div id="bar">
        <div id="toolbar">
        <img src=${toolbar}/>
        <div id="icons">
            <img onclick=${() => emit('switchTool', 'draw')} src="${pencil}">
            <img src="${eraser}">
            <img src="${paintbucket}">
            <img onclick=${() => emit('switchTool', 'drag')} src="${transform}">
            <img onclick=${() => emit('clear')} src="${trash}">
        </div>
        </div>
        <div id="render">${renderButton(emit)}</div>
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

function renderButton(emit: Emit) {
    const onclick = () => emit('mlrender')
    return html`
        <img id="render-img" src=${render} onclick=${onclick}/>
    `
}

function clearButton(emit: Emit) {
    const onclick = () => emit('clear')
    return html`
        <button onclick=${onclick}>clear</button>
    `
}


export function leftView(state: choo.IState, emit: Emit) {
    return html`
    <div id="left">
        <img id="cat" src=${cat}/>
        ${drawView(state, emit)}
        ${topBar(state.app, emit)}
    </div>`
}