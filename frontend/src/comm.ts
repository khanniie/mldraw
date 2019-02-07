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
    console.log(canvasOrImageData)
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

    constructor() { }

    async connect(url: string) {
        if (this.socket !== undefined) this.socket.disconnect()
        this.socket = socketio.connect(url, {
            transports: ['websocket']
        })

        return new Promise((res, rej) => {
            this.socket.once('connect', res)
            this.socket.once('connect_error', () => rej('connection error'))
        })
    }

    async send(tag: Operation, data: RequestMessage): Promise<ReplyMessage | ErrorMessage> {
        return new Promise<ReplyMessage>(res => this.socket.emit(tag, data, res))
    }
}
