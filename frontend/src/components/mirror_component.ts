import { MirrorComponent, mirrorStore } from './mirror'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const star = require('./../assets/star.svg')

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

export function mirrorView(state: choo.IState, emit: Emit) {

    const eraser = ()=> emit('p5-clear', true)
    return html`
    <div class="inside-column">
      <div class="cutebox">
        <div id="mirror-info" class="cutebox_info"> <img src=${star}/>
          rendered view
          <div style="float:right;">
            full size
            <label class="switch">
              <input type="checkbox" onclick=${()=> {

                state.app.mirrorIsFullSize = !(state.app.mirrorIsFullSize);

                if(state.app.mirrorIsFullSize){
                  computeWidth(state, emit);
                }
                else {
                  emit('render');
                  setTimeout(function(){ computeWidth(state, emit);}, 650);
                }

              } } class=${ (state.app.mirrorIsFullSize) ? "checked" : ""}>
              <span class="slider round"></span>
            </label>
          </div>
        </div>
        <div id="canvas-container" class=${(state.app.mirrorIsFullSize) ? "full-size": "" }>
        ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
      </div>
    </div>
    `
}
