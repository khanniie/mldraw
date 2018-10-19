import * as p5 from 'p5'


function make_sketch(p: p5) {
    let prev_x: number = null;
    let prev_y: number = null;

    p.setup = function(){
        p.createCanvas(200, 200);
        p.background(0);
        p.fill(255);
        p.stroke(255);
        p.strokeCap('round');
        p.strokeWeight(5);
    }

    //drawning in draw instead
    // function draw(){
    //     if(mouseIsPressed){
    //         if(prev_x == null && prev_y == null){
    //             prev_x = mouseX;
    //             prev_y = mouseY;
    //         } else {
    //             line(prev_x, prev_y, mouseX, mouseY);
    //             prev_x = mouseX;
    //             prev_y = mouseY;
    //         }
    //     }
    // }

    p.mouseDragged = function(){
        if(prev_x == null && prev_y == null){
            prev_x = p.mouseX;
            prev_y = p.mouseY;
        } else {
            p.line(prev_x, prev_y, p.mouseX, p.mouseY);
            prev_x = p.mouseX;
            prev_y = p.mouseY;
        }
    }
}

const container = document.querySelector("#container") as HTMLElement;
const sketch = new (p5 as any).default(make_sketch, container); // the typings are a little outdated :(