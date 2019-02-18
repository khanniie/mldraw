import { MirrorComponent, mirrorStore } from './mirror'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

export function mirrorView(state: choo.IState, emit: Emit) {
    return html`
    <div id="mirror">
        ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
    </div>
    `
}