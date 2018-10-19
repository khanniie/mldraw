var prev_x = null;
var prev_y = null;

function setup(){
    createCanvas(200, 200);
    background(0);
    fill(255);
    stroke(255);
    strokeCap('ROUND');
    strokeWeight(5);
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

function mouseDragged(){
    if(prev_x == null && prev_y == null){
        prev_x = mouseX;
        prev_y = mouseY;
    } else {
        line(prev_x, prev_y, mouseX, mouseY);
        prev_x = mouseX;
        prev_y = mouseY;
    }
}