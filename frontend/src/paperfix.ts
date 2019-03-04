import * as paperJS from './paper/paper-core.js'

export const paperLocal: typeof paper = (paperJS as any).default as any
