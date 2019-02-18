<<<<<<< Updated upstream
import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

export function drawView(state: choo.IState, emit: Emit) {
    return html`
    <div id="paper">
        ${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
    </div>
    `
=======
import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const heart = require('./../assets/heart.svg')
const render = require('./../assets/render.png')

export function drawView(state: choo.IState, emit: Emit) {
    return html`
    <div class="cutebox">
        <div class="cutebox_info"><img src=${heart}/> drawing view</div>
        <div id="paper">${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
        <div id="render">${renderButton(emit)}</div>
        </div>
    </div>
    `
}

function renderButton(emit: Emit) {
    const onclick = () => emit('mlrender')
    return html`
        <img id="render-img" src=${render} onclick=${onclick}/>
    `
>>>>>>> Stashed changes
}