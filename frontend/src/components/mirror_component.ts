import { MirrorComponent, mirrorStore } from './mirror'
import { P5CanvasComponent, p5CanvasStore } from './p5-canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const star = require('./../assets/star.svg')

export function mirrorView(state: choo.IState, emit: Emit) {

    const eraser = ()=> emit('p5-clear', true)
    return html`
    <div class="inside-column">
      <div class="cutebox">
        <div id="mirror-info" class="cutebox_info"> <img src=${star}/> rendered view </div>
        <div id="canvas-container">
        ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
        ${state.cache(P5CanvasComponent, 'p5-canvas').render(state.app)}</div>
      </div>
    </div>
    `
}
