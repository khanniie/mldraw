import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const logo = require('./../assets/logo1.png')

export function topView(state: choo.IState, emit: Emit) {
    return html`
    <div id="top-container">
    <div id="top">
        <div id="cat">Mldraw!</div>
        <div id="made-by">Made by <a href="http://www.aman.work/">Aman</a> and <a href="https://connieye.com">Connie</a> 	(„• ֊ •„)</div>
    </div></div>`
}
