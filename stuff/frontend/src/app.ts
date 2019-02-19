import * as choo from 'choo'
import html from 'choo/html'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './types'
import { paperStore} from './components/paper_canvas'
import { MirrorComponent, mirrorStore } from './components/mirror'
import { leftView } from './components/left_view'
import { rightView } from './components/right_view'
import { localModelsStore } from './local-models'
import {mirrorView} from './components/mirror_component'
import {paintBucketStore} from './model-palettes'
const app = new (choo as any).default()

app.use(devTools())
app.use(initialState)
app.use(paperStore)
app.use(mirrorStore)
app.use(localModelsStore)
app.use(paintBucketStore)
app.route('/', mainView)
app.mount('body')

function initialState(state: choo.IState, emit: Emit) {
    Object.assign(state, {
        app: {
            server: {
                address: '128.2.103.85:8080',
                isConnected: false
            },
            activeLayer: 1, 
            layers: [],
            localModels: {},
            paintbucket: {
                active: true,
                colorIdx: 0,
                colorName: '',
                palette: {
                    '': ''
                }
            }
        }
    })
}

function mainView(state: choo.IState, emit: Emit) {
    return html`
        <body>
        ${!state.app.server.isConnected ? html`<p>trying to connecte to server...</p>`: ''}
            ${leftView(state,emit)}
            ${rightView(state, emit)}
        </body>`
}

