
/**
 * Wraps fn, returning a function that will do nothing if it has already been called
 * and the inner async function hasn't returned yet. 
 * This lets us use async functions with p5.js's synchronous input API without an async
 * function being called twice whilst it's running 
 * (e.g we'll never send a message to run a layer until the previous input has been fully processed)
 * @param fn Async functionn
 */
export function doNothingIfRunning(fn: () => void): () => void {
    let running = false;
    let bound = fn.bind ? fn.bind(this) : fn; // arrow functions have no bind
    return async function () {
        if(running) return;
        running = true;
        await bound();
        running = false;
    }
}