// Our application's state
export interface AppState {
    server: {
        address: string
    }
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

export type State = import("choo").Choo.IState;
