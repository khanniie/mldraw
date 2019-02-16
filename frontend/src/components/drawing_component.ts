import { PaperCanvasComponent, paperStore} from './paper_canvas'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

export function drawView(state: choo.IState, emit: Emit) {
    return html`
    <div class="border border-horz top"><div class="border border-horz bottom"><div class="border-vert border left "><div class="border-vert border right">
        ${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
    </div></div></div></div>
    `
}