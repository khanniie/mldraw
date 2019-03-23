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
        <div class="cutebox_info"><img src=${heart}/> drawing view</div>
        <div id="paper">${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
        <div id="render" onclick=${onclick} class=${state.app.mouseOnCanvas ? "disappear unselectable" : "unselectable"}>
        ${renderButton(state.app.renderdone)}
        <div class="tooltip-container"><div class="tooltip">render layer</div></div>
        </div></div>
    </div>
    `
}

function renderButton(renderd) {
    return html`
        <img id="render-img" src=${render} class=${renderd ? ``: `spin`} />
    `
}
