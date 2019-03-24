import * as choo from 'choo'
import html from 'choo/html'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './types'
import { paperStore} from './components/paper_canvas'
import { MirrorComponent, mirrorStore } from './components/mirror'
import { leftView } from './components/left_view'
import { rightView } from './components/right_view'
import { topView } from './components/top_view'
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
            width: 2000,
            mouseOnCanvas: false,
            strokeColor: '#000000',
            activeLayer: 1,
            tool: 'draw',
            renderdone: true,
            layers: [],
            availableModels: [],
            localModels: {},
            paintbucket: {
                usable: false,
                active: true,
                colorIdx: 0,
                colorName: '',
                palette: {
                    '': ''
                }
            },
            closed: true,
            smoothing: false,
            warningAccepted: false
        }
    })
    state.app.width = getSumChildrenWidth();
}

function getSumChildrenWidth(){
  let windowhei = window.innerHeight;
  let em = parseFloat(getComputedStyle(document.body).fontSize);
  let columnWid = windowhei - (15 * em) + 4; //calc(100vh - 15em) + 2px borders
  columnWid = (columnWid < 260) ? 260 : columnWid;
  return (columnWid + em) * 2 + 260 + em + 3; //+3 for any int division.. to be safe
}

function computeWidth(state, emit:Emit){
  let totalwid = getSumChildrenWidth();
  state.app.width = (totalwid + 1);
  emit('render')
}

var doit
const resize = function(state, emit){
  clearTimeout(doit);
  doit = setTimeout((()=>computeWidth(state, emit)), 100);
};

function mainView(state: choo.IState, emit: Emit) {
    let wid = state.app.width;
    return html`
        <body onresize=${()=>resize(state, emit)}>
        ${!state.app.server.isConnected ? html`<p>trying to connect to server...</p>`: ''}
            ${topView(state, emit)}
            <div id="bottom-container">
            <div id="bottom" style=${"width: " + wid + "px;"}>
              <div class="column">
                ${leftView(state,emit)}
              </div>
              <div class="column">
                ${rightView(state, emit)}
              </div>
              <div class="column">
                ${mirrorView(state, emit)}
              </div>
            </div></div>
        </body>`
}
