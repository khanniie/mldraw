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
app.route('/tutorial', tutorialView)
app.mount('body')

const close = require('./assets/close.svg')

function initialState(state: choo.IState, emit: Emit) {
    Object.assign(state, {
        app: {
            server: {
                address: '128.237.249.194:8080',
                isConnected: false
            },
            width: 2000,
            mouseOnCanvas: false,
            strokeColor: '#000000',
            activeLayer: 1,
            tool: 'draw',
            automask: true,
            renderdone: true,
            layers: [],
            tutorials: [],
            tutorialtab: 'about',
            mirrorIsFullSize: false,
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
    state.app.width = getSumChildrenWidth(state);
}

function getSumChildrenWidth(state){
  let windowhei = window.innerHeight;
  let windowwid = window.innerWidth;
  let em = parseFloat(getComputedStyle(document.body).fontSize);
  /*calc(100vw - (100vh - 9em - 4px) - 180px - 4em - 12px); */
  let leftcol = 180;
  let borders = 12;
  let margins = em * 3;
  let paper_canvas = windowhei - 9 * em - 4;
  paper_canvas = (paper_canvas < 360 ? 360: paper_canvas);

  if(state.app.mirrorIsFullSize){

    if(( 2 * paper_canvas + leftcol + borders + margins + em) < windowwid) return windowwid;

    return ( 2 * paper_canvas + leftcol + borders + margins + em);

  } else {

    if((paper_canvas + leftcol + borders + margins + 360) < windowwid) return windowwid;

    return (paper_canvas + leftcol + borders + margins + 360);
  }
}

function computeWidth(state, emit:Emit){
  let totalwid = getSumChildrenWidth(state);
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
                ${leftView(state,emit)}
              <div class="column">
                ${mirrorView(state, emit)}
              </div>
            </div></div>
        </body>`
}

function fillContent(piece){
  switch (piece){
    case "about":
      return html`
      <div class="section">
          <div class="header">About</div>
          <div class="content">
            Mldraw is a new vector drawing tool that lets you play with machine learning! Users can mix cats, anime, Pikachu, handbags, imagined buildings and more.
            <br/><br/>
            Mldraw is a web app that uses a layered vector drawing system where each layer can be given a different machine learning model that translates user input. The user will give us a line drawing of edges, and our app's backend server renders the translation using whatever model is assigned to that layer. Furthermore, we've also made it easy to import custom ML models for researchers so that they can use our tool to experiment with their models!
            <br/><br/>
            Made by Connie Ye and Aman Tiwari.
          </div>
        </div>`
    case 'use':
      return html`
      <div class="section">
        <div class="header">How to Use</div>
        <div class="content">
          Make a drawing on the left canvas. This is the line drawing that will be "translated" and the result will show up on the right canvas.
          When you're ready, hit the 'render' button at the bottom right of the left canvas (it looks like a cat button).
          <br/><br/>
          You can choose how our drawing will be translated by selecting the type from the dropdown menu in the layers section.
          If you have any questions for what the ouput should look like or how to use it, click on the question mark next to the model name for more info.
          Note that some models may take a few seconds to load initially, for will take a few seconds to generate output if your drawing is especially complex.
          <br/><br/>
          Masking and bounds editing are essential parts of our tool that are important to understand.
          <br/><br/>
          You can define the portion of your line drawing that gets sent to the machine learning algorithm to be rendered. This is through the bounds editing tool.
          This is important because most line drawings typically get rendered better if they occupy 80% of the canvas and are centered. So, if you are making a
          smaller drawing on the canvas, you can make a smaller bounding box to encompass this smaller drawing.
          <br/><br/>
          Furthermore, an integral part of our applcation is the masking; while we often automatically mask your line drawing so that only what is within your
          lines gets rendered, the automasking is not perfect and sometimes doesn't work when your line paths aren't closed fully. Thus, we also provide a custom
          masking tool so that you can either re-automask, set mask to full bounds (which means it won't clip anything) or carve out parts of the mask to make a
          custom mask.
        </div>
      </div>
      `
    case 'thanks':
      return html`
      <div class="section">
        <div class="header">Special Thanks To</div>
        <div class="content">
          Golan Levin, the Studio for Creative Inquiry, Gray Crawford, Tatyana Mustakos, and many more.
          <br/><br/>
          @sailorhg for making the art that served as the inspiration for the style of our user interface.
        </div>
      </div>
      `
  }
}

function tutorialView(state: choo.IState, emit: Emit) {
    return html`
        <body>
        <a href="../"><button id="back">return to tool</button></a>
        <div class="tutorial-view-container">
          <div class="tabs">
            <div class="tab ${(state.app.tutorialtab === "about") ? "selected-tab" : ""}"
              onclick=${()=>{state.app.tutorialtab = 'about'
                              emit('render')}} >
              about
            </div>
            <div class="tab ${(state.app.tutorialtab === "use") ? "selected-tab" : ""}"
              onclick=${()=>{state.app.tutorialtab = 'use'
                              emit('render')}} >
              how to use
            </div>
            <div class="tab ${(state.app.tutorialtab === "thanks") ? "selected-tab" : ""}"
              onclick=${()=>{state.app.tutorialtab = 'thanks'
                              emit('render')}} >
                thanks to
            </div>
          </div>
          <div class="content-container">
            ${fillContent(state.app.tutorialtab)}
          </div>
        </div>
        </body>`
}
