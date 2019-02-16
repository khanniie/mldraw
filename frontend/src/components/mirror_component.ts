import { MirrorComponent, mirrorStore } from './mirror'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

export function mirrorView(state: choo.IState, emit: Emit) {
    return html`
    <div class="border border-horz top"><div class="border border-horz bottom"><div class="border-vert border left "><div class="border-vert border right">
        ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
    </div></div></div></div>
    `
}