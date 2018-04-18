'use strict';
var base_image;
var ball_image;
var ball_image_halfDim;
var ball_image_threeQuarterDim;
var neon_image;
var neon_image_dim;


var neon_ghost_tile;
var neon_lightning_tile;
var neon_cherry_tile;

var neon_ghost_image;
var neon_lightning_image;
var neon_cherry_image;


var tile_image;
var trail_image;
var trail_image_dim;

var marble;
var marble_halfDim;
var marble_threeQuarterDim;

var heldPoints = []; //holding points of wave origin
var foreverPoints = []; //holding all the trailing points
var clickedPoints = []; //holding pieces of the clicked points

var WAVE_DURATION  = 2000; //1000 miliseconds = 1 second
var WAVE_PERIOD    = Math.floor(WAVE_DURATION / 5);
var AREA_OF_AFFECT = 3; //how far the wave will affect the tiles

let myFx;

function myPreload() {
  pixelDensity(1);
  base_image = loadImage("blackTile.png");
  neon_image = loadImage("blackTile_glow.png");
  neon_image_dim = loadImage("blackTile_glow.png");
  ball_image = loadImage("ball.png");

  neon_ghost_image = loadImage("blackTileWithGhost.png");
  neon_lightning_image = loadImage("blackTileWithLightning.png");
  neon_cherry_image = loadImage("blackTileWithCherry.png");
  

  ball_image_halfDim = loadImage("ball_half_trans.png");
  ball_image_threeQuarterDim = loadImage("ball_threeQuarter_trans.png");
  myFx = loadSound('masterTruise.mp3');

}

function mySetup() {
  tile_image = createGraphics(sprite_width, sprite_height);
  tile_image.image(base_image,0,0);

  trail_image = createGraphics(sprite_width, sprite_height);
  trail_image.image(neon_image,0,0);

  trail_image_dim = createGraphics(sprite_width, sprite_height);
  trail_image_dim.image(neon_image_dim,0,0);

  marble = createGraphics(sprite_width, sprite_height);
  marble.image(ball_image,0,0);

  marble_halfDim = createGraphics(sprite_width, sprite_height);
  marble_halfDim.image(ball_image_halfDim,0,0);

  marble_threeQuarterDim = createGraphics(sprite_width, sprite_height);
  marble_threeQuarterDim.image(ball_image_threeQuarterDim,0,0);


  neon_ghost_tile = createGraphics(sprite_width, sprite_height);
  neon_ghost_tile.image(neon_ghost_image,0,0);

  neon_lightning_tile = createGraphics(sprite_width, sprite_height);
  neon_lightning_tile.image(neon_lightning_image,0,0);

  neon_cherry_tile = createGraphics(sprite_width, sprite_height);
  neon_cherry_tile.image(neon_cherry_image,0,0);
}

function myDraw() {
  //setting background color
  background(64,0,64);
}

function myHandleClick(i, j) {
  var newTime = new Date().getTime(); //getting current point in time
  //pushing new x, y, and time of start into held points array
  clickedPoints.push([i, j]);
  clickedPoints.push([i + 1, j + 1]);
  clickedPoints.push([i - 1, j - 1]);
  clickedPoints.push([i - 1, j + 1]);
  let q = random([2,4]);
  //changed my mind on sounds. only ended up liking these 2
  if(q == 2) {
    myFx.jump(q, 2);
  }
  else {
    myFx.jump(q, 1)
  }
}

//calculating ripple effect from held points array
function myTileHeight(i, j) {
  var currentTime = new Date().getTime();

  //outputting ground lightning upon click
  for(var k = 0; k < clickedPoints.length; k++) {
    var heldX = clickedPoints[k][0];
    var heldY = clickedPoints[k][1];

    if(heldX == i && heldY == j) {
      //possibility for the lightning to keep propagating
      if(noise(i, j) > 0.5) {
        var randXOff = Math.floor(Math.random() * 3) - 1;
        var randYOff = Math.floor(Math.random() * 3) - 1;
        clickedPoints.push([i + randXOff, j + randYOff]);
      }
      else {
        clickedPoints.shift();
      }

      return 1.0;
    }
  }

  for(var k = 0; k < heldPoints.length; k++) {
    var heldX = heldPoints[k][0];
    var heldY = heldPoints[k][1];
    var heldTime = heldPoints[k][2];

      var distBetween = Math.sqrt( (heldX - i) * (heldX - i) + (heldY - j) * (heldY - j) ) + 0.5;

      //using noise to make wave pattern look more random
      if(distBetween <= AREA_OF_AFFECT - noise(i, j)) {
        // console.log("currentTime: " + currentTime);
        // console.log("heldTime:    " + heldTime);
        // console.log("CT - HT:     " + (currentTime - heldTime));
        
        if((currentTime - heldTime) >= WAVE_DURATION) {

          heldPoints.shift();
          return 0;
        }

        var theta = ( 2 * Math.PI * ( ( currentTime - heldTime ) % WAVE_PERIOD ) ) / WAVE_PERIOD;
        // console.log("theta: " + theta);

        var height = - Math.cos(theta);
        // console.log("ripple: " + ripple);

        return height;
      }
  }

  var noisy = noise(i, j);

  if(noisy >= 0.85 && noisy < 0.856) return 1.01;
  if(noisy >= 0.856 && noisy < 0.86) return 1.02;
  if(noisy >= 0.86) return 1.03;

  return 0;

}

function myTileVariation(i, j, height) {
  return height;
}

function myDrawTile(i, j, variation) {
  var foreverPointOutput = false;
  var specialPoint = false;
  var brokenPoint = false;

    if(variation == 1.01) {
        image(neon_ghost_tile, 0, 0);
        specialPoint = true;
    }
    else if(variation == 1.0) {
        specialPoint = true;
    }
    else if(variation == 1.02) {
        image(neon_lightning_tile, 0, 0);
        specialPoint = true;
    }
    else if(variation == 1.03) {
        image(neon_cherry_tile, 0, 0);
        specialPoint = true;
    }
    else {
      for(var k = 0; k < foreverPoints.length; k++){
        if(foreverPoints[k][0] == i && foreverPoints[k][1] == j && k > 20) {
          image(trail_image, 0, variation);
          foreverPointOutput = true;
        }
        else if(foreverPoints[k][0] == i && foreverPoints[k][1] == j && k <= 20) {
          image(trail_image_dim, 0, variation);
          foreverPointOutput = true;
        }
      }
    }

    if(!foreverPointOutput && !specialPoint) {
      image(tile_image, 0, variation);
    }
}

function myTileDescription(i,j, variation) {
  return "Variation: " + variation;
}

function myHandleWorldgenStringChange(key) {
  noiseSeed(0);
}
