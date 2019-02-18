
/**
 * Wraps fn, returning a function that will do nothing if it has already been called
 * and the inner async function hasn't returned yet. 
 * This lets us use async functions with p5.js's synchronous input API without an async
 * function being called twice whilst it's running 
 * (e.g we'll never send a message to run a layer until the previous input has been fully processed)
 * @param fn Async functionn
 */
export function doNothingIfRunning(asyncFn: (...args: any[]) => void): () => void {
    let running = false
    const bound = asyncFn.bind ? asyncFn.bind(this) : asyncFn // arrow functions have no bind
    return async (...args) => {
        if(running) return
        running = true
        await bound(...args)
        running = false
    }
}

/**
 * Helper function to get a parameter from the URL query string
 * (i.e the key=value part)
 * @param key Key in params
 */
export function urlParam(key: string): string | null {
    const params = new URLSearchParams(window.location.search)
    return params.get(key)
}