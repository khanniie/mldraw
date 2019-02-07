import * as choo from 'choo'
import html from 'choo/html'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './types'
import { PaperCanvasComponent, paperStore} from './components/paper_canvas'
import { MirrorComponent, mirrorStore } from './components/mirror'
import { paper } from './paperfix'

const app = new (choo as any).default()
console.log(paper)
app.use(devTools())
app.use(initialState)
app.use(paperStore)
app.use(mirrorStore)
app.route('/', mainView)
app.mount('body')
function initialState(state: choo.IState, emit: Emit) {
    Object.assign(state, {
        app: {
            server: {
                address: '128.2.103.85:8080'
            },
            activeLayer: null,
            layers: []
        }
    })
}

function dropdownContent(emit:Emit, layer, i:number, state){
  return html`<div class="dropdown-content">
   <a href="#" onclick=${() => changeModel(state, i, 'edges2shoes_pretrained')}>Shoes</a>
   <a href="#" onclick=${() => changeModel(state, i, 'flip_canvas')}>Flip</a>
 </div>`;
}

function changeModel(appState:AppState, idx, model){
  appState.layers[idx].model = model;
  console.log("model changed idx: ", idx);
  console.log('current state', appState);
}

function mainView(state: choo.IState, emit: Emit) {
    return html`
        <body>
            <h1>mldraw</h1>
            ${topBar(state.app, emit)}
            ${state.cache(PaperCanvasComponent, 'paper-canvas').render(state.app)}
            ${state.cache(MirrorComponent, 'p5-mirror').render(state.app)}
        </body>`
}

function topBar(state: AppState, emit: Emit) {
    const layers = state.layers.map((layer, i) => {
        let name = layer == state.activeLayer ? 'SELECTED Layer' + (i + 1) : 'Layer' + (i + 1);
        return html`<li class="menu-item dropdown"><button onclick=${() => emit('changeLayer', i + 1)}>
            ${name}</button>${dropdownContent(emit, layer, i, state)}</></li>`
    })
    return html`
    <div>
        <ul>
        <li class="menu-item">${serverSelector(state.server, emit)}</li>
        <li class="menu-item">${renderButton(emit)}</li>
        <li class="menu-item">${clearButton(emit)}</li>
        <li class="menu-item"><p>${state.activeLayer}</p></li>
        <li class="menu-item"><button onclick=${() => emit('addLayer')}>+</button></li>
        ${layers}
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
