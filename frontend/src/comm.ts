import * as socketio from "socket.io-client"

export enum Operation {
    flip_canvas = 'flip-canvas',
    edges2shoes_pretrained = 'edges2shoes_pretrained'
}

export type RequestMessage = {
    canvasData?: Blob,
    imageData?: {
        data: ArrayBuffer,
        width: number,
        height: number
    }
}

export type ReplyMessage = {
    canvasData: string
}

export type ErrorMessage = {
    error: string
}

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((res, rej) => {
        try {
            canvas.toBlob(res)
        } catch (err) {
            rej(err)
        }
    })
}

function viewToBuffer(view: ArrayBufferView) {
    if(view.byteOffset == 0 && view.byteLength == view.buffer.byteLength) return view.buffer
    else return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
}

export async function serialize(canvasOrImageData: HTMLCanvasElement | ImageData): Promise<RequestMessage> {
    if (canvasOrImageData instanceof HTMLCanvasElement) return { canvasData: await toBlob(canvasOrImageData) }
    else return Promise.resolve({ 
        imageData: {
            data: viewToBuffer(canvasOrImageData.data),
            width: canvasOrImageData.width,
            height: canvasOrImageData.height 
        }
    })
}

export class Comm {
    socket: SocketIOClient.Socket
    // map from available models to url of model
    model2url: {[key: string]: string}
    // map from urls to sockets
    url2socket: {[key: string]: Promise<SocketIOClient.Socket>}
    constructor() {
        this.model2url = {}
        this.url2socket = {}
     }

    async connect(url: string) {
        if (this.socket !== undefined) this.socket.disconnect()
        this.socket = socketio.connect(url, {
            transports: ['websocket']
        })

        await new Promise((res, rej) => {
            this.socket.once('connect', res)
            this.socket.once('connect_error', () => rej('connection error'))
        }) as {[key: string]: string[]}
        const models = await new Promise(res => this.socket.emit('list-models', res)) as {[key: string]: string[]}
        console.log(models)
        this.update_models(models)
        this.socket.on('update-available-handlers', msg => this.update_models(msg))
    }

    // update map of models & urls and connect to newly discovered models
    update_models(handlers: {[key: string]: string[]}) {
        const new_handlers = {}
        const urls = Object.keys(handlers)
        urls.forEach(url => handlers[url].forEach(handler => new_handlers[handler] = url))
        this.model2url = {...this.model2url, ...new_handlers}

        for(const model of Object.keys(this.model2url)) {
            const url = this.model2url[model]
            if(this.url2socket[url] == undefined) {
                const new_socket = socketio.connect(url, {
                    transports: ['websocket']
                })
                this.url2socket[url] = new Promise((res, rej) => {
                    new_socket.once('connect', () => res(new_socket))
                    new_socket.once('connect_error', () => rej(`connection error to ${url}`))
                })
            }
        }
    }

    available_models() {
        return Object.keys(this.model2url)
    }

    async send(tag: Operation, data: RequestMessage): Promise<ReplyMessage | ErrorMessage> {
        console.log(this.model2url, this.url2socket)
        if(!(tag in this.model2url)) throw new Error(`No model connected with name ${tag}, available: ${this.available_models()}`)
        return this.url2socket[this.model2url[tag]]
            .then(socket => new Promise<ReplyMessage>(res => socket.emit(tag, data, res)))
    }
}
