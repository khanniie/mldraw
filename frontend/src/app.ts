import * as choo from 'choo'
import raw from 'choo/html/raw'
import html from 'choo/html'
import devTools from 'choo-devtools'
import { State, AppState, Emit, Emitter } from './types'
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
app.use(tutorialReducer)
app.route('/', mainView)
app.mount('body')

const close = require('./assets/close.svg')

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
            tutorials: [],
            overlay: "",
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
            warningAccepted: false,
            maskEditingMode: false
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
  clearTimeout(doit)
  doit = setTimeout((()=>computeWidth(state, emit)), 100)
};

function tutorialReducer(state: AppState, emitter: Emitter) {
    emitter.on('loadtutorial', (model:string) => {
      console.log(state.app.tutorials);
      if(state.app.tutorials[model] == undefined) {

        fetch(`./model_info/${model}.json`)
        .then(res => res.json())
        .then((tutorial) => {
          state.app.tutorials[model] = tutorial
          emitter.emit('render')
        })
    } else {
      console.log("error... shouldn't have gotten here.")
    }
  })
}

const loading_tutorial = {
  "name": "Loading info...",
  "tools" : [],
  "palette" : [],
  "load_type": "Loading info...",
  "description" : "Loading info...",
  "tutorial" : "<p>Loading info...</p>"
}

function make_overlay(model_json, load_time, state, emit){
  const close_overlay = () => {
    state.app.overlay = "";
    emit('render');
  }
  return html `<div class="underlay">
    <div class="overlay">
      <img id="close_o" src = ${close} onclick=${close_overlay}/>
      <h1>${model_json.name} model</h1>
        ${model_json.description}
        <br>
        <p><b>Load times:</b> ${load_time}</p>
        ${raw(model_json.tutorial)}
    </div>
  </div>`
}

function modelInfoOverlay(modelname:string, state, emit){

  if(state.app.tutorials[modelname] == undefined){
    emit('loadtutorial', modelname);
    return make_overlay(loading_tutorial, "Loading...", state, emit)
  }

  const tutorial = state.app.tutorials[modelname]

  const load_time = (tutorial.load_type === "server") ? "If our servers are running normally, projected render times are about 1 second." :
    "This model needs to be loaded once, so on first render it will take 5 - 10 seconds and the next renders should take about 1 second."

  return make_overlay(tutorial, load_time, state, emit)

}

function overlay(state, emit){
  if (state.app.overlay === "")
    return html`<div></div>`;
  else
    return modelInfoOverlay(state.app.overlay, state, emit);
}

function mainView(state: choo.IState, emit: Emit) {
    let wid = state.app.width;
    return html`
        <body onresize=${()=>resize(state, emit)}>
        ${!state.app.server.isConnected ? html`<p>trying to connect to server...</p>`: ''}
            ${topView(state, emit)}
            ${overlay(state, emit)}
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
