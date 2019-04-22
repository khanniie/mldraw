import { MirrorComponent, mirrorStore } from './mirror'
import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'
import * as filesaver from 'file-saver'

const star = require('./../assets/star.svg')

export function mirrorView(state: choo.IState, emit: Emit) {
    const save = () => {
      var canvas = document.getElementById("mirror-canvas-element");
      canvas.toBlob(function(blob) {
        filesaver.saveAs(blob, "mldraw-output.png");
      });
    }
    return html`
    <div class="inside-column">
      <div class="cutebox">
      <div id="mirror-info" class="cutebox_info"> <img src=${star}/> rendered view </div>
          ${state.cache(MirrorComponent, 'mirror-canvas').render(state.app)}
      </div>
      <button id="save-img" onclick=${save}>save image</button>
    </div>
    `
}
