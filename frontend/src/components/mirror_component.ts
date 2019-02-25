import { MirrorComponent, mirrorStore } from './mirror'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const star = require('./../assets/star.svg')

export function mirrorView(state: choo.IState, emit: Emit) {
    return html`
    <div id="mirror" class="cutebox">
    <div id="loading">
    <div id="mirror-info" class="cutebox_info"> <img src=${star}/> rendered view </div>
        ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
    </div></div>
    `
}
