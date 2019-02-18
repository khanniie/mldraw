import * as ml5 from 'ml5'
import { State, Emitter } from './types';
import { ReplyMessage } from './comm';

const modelUrls = {
    'edges2cat': 'https://rawcdn.githack.com/affinelayer/pix2pix-tensorflow-models/68fd4e2cf7fbf42ea82a379d49045416ebb857ec/edges2cats_AtoB.pict',
    'edges2handbag': 'https://rawcdn.githack.com/affinelayer/pix2pix-tensorflow-models/68fd4e2cf7fbf42ea82a379d49045416ebb857ec/edges2handbags_AtoB.pict'
}

type ML5Model = {
    transfer(input: ImageData | HTMLCanvasElement): Promise<HTMLImageElement>
}

const objMap = (obj, fn) => {
    const keys = Object.keys(obj)
    const result = {}
    for(const k of keys) result[k] = fn(obj[k], k)
    return result
}

class LocalModels {
    models: {[key: string]: Promise<ML5Model>}
    
    constructor() {
        this.models = objMap(modelUrls, url => ml5.pix2pix(url))
        console.log(this.models)
    }

    async loadModel(modelName: string) {
        if(this.models[modelName].ready) console.log('loading model ' + modelName)
        return await this.models[modelName]
    }

    available_models() {
        return Object.keys(this.models)
    }

    async execute(modelName: string, input: ImageData) {
        if(!(modelName in modelUrls)) throw new Error(`No model named ${modelName}, available: ${Object.keys(modelUrls)}`)
        const model = await this.models[modelName]
        const result = await model.transfer(input)
        return { canvasData: result }
    }
}

export const localModels = new LocalModels()

export function localModelsStore(state: State, emitter: Emitter) {
    state.app.localModels = objMap(modelUrls, name => 'notLoaded')
    emitter.on('loadmodel', async (name) => {
        state.app.localModels[name] = 'loading'
        await localModels.loadModel(name)
        emitter.emit('loadedmodel', name)
        emitter.emit('render')
    })
    emitter.on('loadedmodel', name => {
        state.app.localModels[name] = 'loaded'
        emitter.emit('render')
    })
    localModels.loadModel('edges2cat')
}