import * as socketio from "socket.io-client"

export enum Operation {
    flip_canvas = 'flip-canvas'
}

export type RequestMessage = {
    canvasData: Blob
}

export type ReplyMessage = {
    canvasData: ArrayBuffer
}

export type ErrorMessage = {
    error: string
}

export async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise<Blob>((res, rej) => { 
        try { 
            canvas.toBlob(res) 
        } catch (err) { 
            rej(err) 
        } 
    })
}

export class Comm {
    socket: SocketIOClient.Socket

    constructor() {}

    async connect(url: string) {
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
