import * as choo from 'choo'
import devTools from 'choo-devtools'
import { State, AppState, Emit } from './../types'
import html from 'choo/html'

const logo = require('./../assets/logo1.png')

export function topView(state: choo.IState, emit: Emit) {
    return html`
    <div id="top-container">
    <div id="top">
        <div id="cat">Mldraw!</div><a href="/tutorial"><div id="info">more info & tutorial</div></a>
        <div id="made-by">Made by <a href="http://www.aman.work/">Aman</a> and <a href="https://connieye.com">Connie</a> 	(„• ֊ •„)</div>
        <div id="github">mldraw is an <a href="https://github.com/khanniie/mldraw">open source project</a>! <br>Please report any <a href="https://github.com/khanniie/mldraw/issues">issues</a> to our github.</div>
    </div></div>`
}
