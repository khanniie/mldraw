/**
 * API Types
 */


/**
 * UI Types
 */

export type Layer = {  layer: paper.Layer, group: paper.Group, model: string }

// Our application's state
export interface AppState {
    server: {
        address: string,
        isConnected: boolean
    },
    activeLayer: number,
    layers: Layer[],
    overlay: string,
    tool: string,
    renderdone: boolean,
    availableModels: string[],
    localModels: {[key:string]: string},
    tutorials: undefined[],
    paintbucket: {
        usable: boolean,
        active: boolean,
        colorIdx: number,
        colorName: string,
        palette: {[key:string] : string}
    },
    closed: boolean,
    smoothing: boolean,
    strokeColor: string
    warningAccepted: boolean,
    maskEditingMode: boolean
}

/**
 * The events our app will respond to
 * This is a map of event names to the types the handlers take
 * e.g, the event setURL has a payload of string
 */
export interface Events {
    // choo's events
    render: undefined

    // our events
    setURL: string
    mlrender: undefined
    clear: undefined
    drawoutput: [string, paper.Group, paper.Rectangle]
    changeLayer: number,
    addLayer: undefined,
    deleteLayer: undefined,
    isConnected: undefined,
    setSmoothness: boolean,
    setClosed: boolean,
    switchTool: string,
    loadtutorial: undefined,
    loadmodel: string,
    loadedmodel: string,
    setFill: string | boolean,
    paintbucketclicked: string,
    addModel: string,
    setStrokeColor: string,
    resetBounds: undefined,
    resetFills: undefined,
    showModelChangeWarning: undefined,
    canceloutput: undefined
}

// type magic ~
export type EventNames = keyof Events
export type Emit = {
    <TName extends EventNames>(name: TName, args?: Events[TName]): void
}

export interface Emitter {
    on<TName extends EventNames>(name: TName, handler: (args?: Events[TName]) => void): void
    emit: Emit
}

// inject our state's type into choo's IState
declare module "choo" {
    namespace Choo {
        interface IState {
            app: AppState,
            cache: any
        }
    }
}

export type State = import("choo").Choo.IState
