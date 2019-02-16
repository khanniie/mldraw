import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import {drawView} from './drawing_component'

const cat = require('./../assets/cat.png');


function topBar(state: AppState, emit: Emit) {
    return html`
    <div id="bar">
        <ul>
        <li class="menu-item">${renderButton(emit)}</li>
        <li class="menu-item">${clearButton(emit)}</li>
    </div>`
}

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
        <button onclick=${onclick}>Render</button>
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
        ${topBar(state.app, emit)}
        ${drawView(state, emit)}
    </div>`
}