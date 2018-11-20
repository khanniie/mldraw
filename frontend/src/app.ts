import * as choo from 'choo'
import html from 'choo/html'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './types'
import { CanvasComponent, canvasStore } from './components/canvas'
import { PaperCanvasComponent, paperStore} from './components/paper_canvas'
import { MirrorComponent, mirrorStore } from './components/mirror'
import { paper } from './paperfix'

const app = new (choo as any).default()
console.log(paper)
app.use(devTools())
app.use(initialState)
app.use(canvasStore)
app.use(paperStore)
app.use(mirrorStore)
app.route('/', mainView)
app.mount('body')

function initialState(state: choo.IState, emit: Emit) {
    Object.assign(state, {
        app: {
            server: {
                address: '128.237.225.218:8080'
            }
        }
    })
}

function mainView(state: choo.IState, emit: Emit) {
    return html`
        <body>
            <h1>mldraw</h1>
            ${topBar(state.app, emit)}
            ${state.cache(CanvasComponent, 'p5-canvas').render(state.app)}
            ${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
            ${state.cache(MirrorComponent, 'p5-mirror').render(state.app)}
        </body>`
}

function topBar(state: AppState, emit: Emit) {
    return html`
    <div>
        <ul>
        <li class="menu-item">${serverSelector(state.server, emit)}</li>
        <li class="menu-item">${renderButton(emit)}</li>
        <li class="menu-item">${clearButton(emit)}</li>
        </ul>
    </div>`
}

function serverSelector({ address }: AppState['server'], emit: Emit) {
    const onsubmit = (e: Event) => {
        e.preventDefault()
        const form = e.currentTarget as HTMLFormElement
        const body = new FormData(form)
        const url = body.get("serverURL")
        emit('setURL', url.toString())
    }
    return html`
    <form onsubmit=${onsubmit}>
        <input name="serverURL" type="url" placeholder="Backend server URL" value=${address}>
        <button type="submit">Connect</button>
    </form>
    `
}

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
