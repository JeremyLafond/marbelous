'use strict';

// Define a bunch of global settings. If you want to use a different tile size, adjust these numbers.
let tile_width_step = 32; // A width step is half a tile's width
let tile_height_step = 14.5; // A height step is half a tile's height
let sprite_width = 96;
let sprite_height = 194;
let sprite_margin_left = 16;
let sprite_margin_top = 82;

//Larger tile dimensions...
//let tile_width_step = 64; // A width step is half a tile's width
//let tile_height_step = 28.5; // A height step is half a tile's height
//let sprite_width = 192;
//let sprite_height = 387;
//let sprite_margin_left = 32;
//let sprite_margin_top = 164;

// Global variables. These will mostly be overwritten in setup().
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;
let VELOCITY_MAX = 10;
let VELOCITY_INC = 1;
let EASE = .04;
let currX, currY;
let mySound;

/////////////////////////////
// Transforms between coordinate systems
// These are actually slightly weirder than in full 3d...
/////////////////////////////
function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step;
    let j = (world_x + world_y) * tile_height_step;
    return [i + camera_x, j + camera_y];
}

function worldToCamera([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step;
    let j = (world_x + world_y) * tile_height_step;
    return [i, j];
}

function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], (offset[0] + offset[1])];
}

function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= tile_width_step * 2;
    screen_y /= tile_height_step * 2;
    screen_x += 0.5;
    return [Math.floor((screen_y + (screen_x))),
    Math.floor((screen_y - (screen_x)))];
}

function cameraToWorldOffset([camera_x, camera_y]) {
    let world_x = camera_x / (tile_width_step * 2);
    let world_y = camera_y / (tile_height_step * 2);
    return {x: Math.round(world_x), y: Math.round(world_y)};
}

function preload() {
    myPreload();
    mySound = loadSound('propogation.mp3');
}

function setup() {
    //width = 800, height = 600
    //quick and dirty way to deal with landscaping/portrait issues on a phone
    let canvas = createCanvas(displayWidth, displayHeight);
    canvas.parent("container");

    let label = createP();
    label.html("Worldgen key:")
    label.parent("container");
    let input = createInput();
    input.parent("container");
    input.changed(function() {
        myHandleWorldgenStringChange(input.value());
    });

    myHandleWorldgenStringChange("");

    camera_offset = new p5.Vector(0,0);
    camera_velocity = new p5.Vector(0,5);
    
    // Dynamically set the number of tiles that will display on our canvas at once, based on the canvas size.
    tile_columns = Math.ceil( width / (tile_width_step * 2)) + 1;
    tile_rows    = Math.ceil( height / (tile_height_step * 2)) + 3; // The +3 is to keep drawing rows after the screen because tall tiles may protrude into the screen area

    mySetup();
    mySound.loop();
}

// mouseClicked is one of the callback handler functions in p5.js. We
// redefine it here to do what we want it to do.
function mouseClicked() {
    let world_pos = screenToWorld([0 - width/2, height/2], [camera_offset.x, camera_offset.y]);
    myHandleClick(world_pos[0], world_pos[1]);
}

// And now for the core loop...
function draw() {
    
    background(64,0,64);

    //getting phone tilt and orientation data
    var tiltData = gyro.getOrientation();

    //tilt controls
    if(tiltData.gamma < 0) {
      if(camera_velocity.y <= VELOCITY_MAX){
        camera_velocity.x -= Math.abs(tiltData.gamma) * EASE;
      }
    }
    if(tiltData.gamma > 0) {
      if(camera_velocity.y <= VELOCITY_MAX){
        camera_velocity.x += Math.abs(tiltData.gamma) * EASE;
      }
    }
    if(tiltData.beta > 0) {
      if(camera_velocity.y <= VELOCITY_MAX){
        camera_velocity.y -= Math.abs(tiltData.beta) * EASE;
      }
    }
    if(tiltData.beta < 0) {
      if(camera_velocity.y <= VELOCITY_MAX){
        camera_velocity.y += Math.abs(tiltData.beta) * EASE;
      }
    }

    //keyboard controls
    if(keyIsDown(65)) {
      camera_velocity.x -= VELOCITY_INC;
    }
    if(keyIsDown(68)) {
        camera_velocity.x += VELOCITY_INC;
    }
    if(keyIsDown(83)) {
        camera_velocity.y -= VELOCITY_INC;
    }
    if(keyIsDown(87)) {
        camera_velocity.y += VELOCITY_INC;
    }
    
    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95); // cheap easing
    if(camera_velocity.mag() < 0.01) { camera_velocity.setMag(0);}

    let world_pos = screenToWorld([0 - width/2, height/2], [camera_offset.x, camera_offset.y]);
    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
    
    for(let y = -3; y < tile_rows; y++) { // Start at negative to draw offscreen
      for (let x = -1; x < tile_columns; x++) {
        drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [camera_offset.x, camera_offset.y], [camera_offset.x, camera_offset.y]); // odd row
      }
      for (let x = -1; x < tile_columns; x++) {
        drawTile(tileRenderingOrder([x+0.5+world_offset.x,y+0.5-world_offset.y]), [camera_offset.x, camera_offset.y], world_pos); // even rows are offset horizontally
      }
    }

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);

    //adding blur effect to ball on based on camera velocity
    image(ball_image_halfDim,
      width / 2 - 55 - camera_velocity.x / 2,
      height / 2 - 60 + camera_velocity.y / 2);

    image(ball_image_threeQuarterDim,
      width / 2 - 55 - camera_velocity.x,
      height / 2 - 60 + camera_velocity.y);

    image(ball_image, width / 2 - 55, height / 2 - 60);

    var noiseScale=0.02;

    // //outputting mountain background to the screen
    // for (var x=0; x < width; x++) {
    //   var noiseVal = noise((world_offset.x+x)*noiseScale, world_offset.y*noiseScale);
    //   stroke(0);
    //   line(x, world_offset.y+noiseVal*100 + 470, x, height);
    // }

    // //outputting mountain lines to the screen
    // for (var x=0; x < width; x++) {
    //   stroke(255);
    //   line(height - x + 50, noise(height - x), noise(height - x), height - x + 50);
    // }

    // //outputting mountain lines to the screen
    // for (var x=0; x < width; x++) {
    //   var noiseVal = noise((world_offset.x+x)*noiseScale, world_offset.y*noiseScale);
    //   stroke(20);
    //   line(x, world_offset.y+noiseVal*80 + 500, x, height);
    // }

    // //outputting mountain lines to the screen
    // for (var x=0; x < width; x+=5) {
    //   var noiseVal = noise((world_offset.x+x)*noiseScale, world_offset.y*noiseScale);
    //   stroke(40);
    //   line(x, world_offset.y+noiseVal*60 + 530, x, world_offset.y+noiseVal*30 + 530 + 5);
    // }

    // //outputting mountain lines to the screen
    // for (var x=0; x < width; x++) {
    //   var noiseVal = noise((world_offset.x+x)*noiseScale, world_offset.y*noiseScale);
    //   stroke(60);
    //   line(x, world_offset.y+noiseVal*40 + 560, x, height);
    // }

}

function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);

    //setting current x and current y so the ball won't update before it moves again
    if(world_x != currX || world_y != currY) {
      currX = world_x;
      currY = world_y;

      //pushing new x, y, and time of start into held points array
      var newTime = new Date().getTime();
      heldPoints.push([world_x, world_y, newTime]);
      foreverPoints.push([world_x, world_y]);

      //foreverPoints cap at 20
      if(foreverPoints.length >= 40) {
        foreverPoints.shift();
      }
    }

    // screen_x -= sprite_margin_left;
    // screen_y -= sprite_margin_top;
    // screen_x += tile_width_step;
    // let height = myTileHeight(world_x, world_y);
    // let variation = myTileVariation(world_x, world_y, height);
    // let height_offset = height * tile_height_step;
    // drawTileDescription(world_x, world_y, variation, [(0 - screen_x), (screen_y - height_offset)]);
}

function drawTileDescription(world_x, world_y, variation, [screen_x, screen_y]) {
    stroke(255, 60);
    fill(255,0,0,60);
    beginShape();
    vertex((screen_x) + sprite_margin_left, (screen_y + (sprite_height/2) - 1));
    vertex((screen_x) + (sprite_width/2), (screen_y + sprite_margin_top));
    vertex((screen_x) + sprite_width - sprite_margin_left, (screen_y + (sprite_height/2) - 1));
    vertex((screen_x)  + (sprite_width/2), (screen_y + sprite_margin_top + tile_height_step + tile_height_step));
    endShape(CLOSE);
    
    textAlign(CENTER);
    textSize(18);
    textStyle(BOLD);
    fill(255,255,255,255);
    text([world_x,world_y], (screen_x) + (sprite_width/2), screen_y + (sprite_height/2) - 1);
    // textSize(12);
    // textStyle(NORMAL);
    // let description_offset = 18;
    // text(myTileDescription(world_x,world_y,variation), (screen_x) + (sprite_width/2), screen_y + (sprite_height/2) - 1 + description_offset);
}

function drawTile([world_x, world_y], [camera_x, camera_y], [mouse_world_x, mouse_world_y]) {
    let [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);

    screen_x -= sprite_margin_left;
    screen_y -= sprite_margin_top;
    screen_x += tile_width_step;

    let height = myTileHeight(world_x, world_y);

    let variation = myTileVariation(world_x, world_y, height);

    let height_offset = height * tile_height_step;
    
    translate((0 - screen_x), (screen_y - height_offset));
    myDrawTile(world_x, world_y, variation);

    translate(-(0 - screen_x), -(screen_y - height_offset));
}

