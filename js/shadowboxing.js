/**
 * Shadowboxing: CS 247 P2
 * -----------------------
 * Questions go to Piazza: https://piazza.com/stanford/winter2013/cs247/home
 * Performs background subtraction on a webcam or kinect driver to identify
 * body outlines. Relies on HTML5: <video> <canvas> and getUserMedia().
 * Feel free to configure the constants below to your liking.
 * 
 * Created by Michael Bernstein 2013
 */

SHOW_RAW = false;
SHOW_SHADOW = true;
var INPUT = "webcam";
var SHADOW_THRESHOLD = 10;
var BACKGROUND_ALPHA = 0.05;
var STACK_BLUR_RADIUS = 10; 

var mWidth = 500;
var mHeight = 400;


/*
 * Begin shadowboxing code
 */
var mediaStream, video, rawCanvas, rawContext, shadowCanvas, shadowContext, background = null;
var started = false;

var testCanvas, testContext;

var allCanvases = [];	//array of 5 canvases, layered on top of each other
var roundsShapes = [];	//array of rounds, each round is an array of 5 shapes, each shape is an array of points
var currentRound = 0;
var TOTAL_ROUNDS = 3;
//var inBetweenRounds = false;

var black = "#000000";
var green = "#00FF00";


$(document).ready(function() {

	initializeRoundsShapes();
    initializeDOMElements();
    initializeCanvases();

    $("#background").attr('disabled', true);
	if (INPUT == "webcam") {
		setUpWebCam();
	}

    $('#background').click(function() {
        setBackground();
        if (!started) {
            renderShadow();
        }
    });
});


/************************************************************
 * INITIALIZER FUNCTIONS
 *************************************************************/

function initializeRoundsShapes(){
	var round0 = [];	//each round is an array of shapes
	var round1 = [];
	var round2 = [];
	var round3 = [];
	
	//each shape is an array of points
	//have to do it this way because won't let you rotate shapes without rotating context as well
	var round0shape0 = [{x: 187.5, y: 50}, {x: 312.5, y: 50}, {x: 312.5, y: 300}, {x:187.5, y:300}];
	var round0shape1 = [{x: 125, y: 150}, {x: 187.5, y: 150}, {x: 187.5, y: 200}, {x: 125, y: 200}];
	var round0shape2 = [{x: 312.5, y: 150}, {x: 375, y: 150}, {x: 375, y: 200}, {x: 312.5, y: 200}];
	var round0shape3 = [{x: 187.5, y: 300}, {x: 250, y:300}, {x: 250, y: 400}, {x: 187.5, y: 400}];
	var round0shape4 = [{x: 250, y: 300}, {x: 312.5, y: 300}, {x: 312.5, y: 400}, {x: 250, y:400}];
	round0.push(round0shape0, round0shape1, round0shape2, round0shape3, round0shape4);
	
	var round1shape0 = [{x: 0, y: 400}, {x: 62.5, y: 400}, {x: 125, y: 300}, {x:125, y:200}];
	var round1shape1 = [{x: 125, y: 200}, {x: 125, y: 300}, {x: 187.5, y: 400}, {x: 250, y: 400}];
	var round1shape2 = [{x: 250, y: 200}, {x: 350, y: 200}, {x: 350, y: 250}, {x: 250, y: 250}];
	var round1shape3 = [{x: 350, y: 100}, {x: 400, y:100}, {x: 400, y: 400}, {x: 350, y: 400}];
	var round1shape4 = [{x: 400, y: 200}, {x: 500, y: 200}, {x: 500, y: 250}, {x: 400, y:250}];
	round1.push(round1shape0, round1shape1, round1shape2, round1shape3, round1shape4);

	var round2shape0 = [{x: 0, y: 400}, {x: 125, y: 200}, {x: 125, y: 300}, {x:62.5, y:400}];
	var round2shape1 = [{x: 125, y: 200}, {x: 125, y: 300}, {x: 187.5, y: 400}, {x: 250, y: 400}];
	var round2shape2 = [{x: 125, y: 200}, {x: 187.5, y: 300}, {x: 437.5, y: 300}, {x: 437.5, y: 200}];
	var round2shape3 = [{x: 250, y: 100}, {x: 250, y:200}, {x: 375, y: 200}];
	var round2shape4 = [{x: 312.5, y: 300}, {x: 437.5, y: 300}, {x: 437.5, y: 400}];
	round2.push(round2shape0, round2shape1, round2shape2, round2shape3, round2shape4);
	/*
	var round3shape0 = {x: 50, y: 350, width: 50, height: 50};
	var round3shape1 = {x: 150, y: 350, width: 50, height: 50};
	var round3shape2 = {x: 250, y: 350, width: 50, height: 50};
	var round3shape3 = {x: 350, y: 350, width: 50, height: 50};
	var round3shape4 = {x: 450, y: 350, width: 50, height: 50};
	round3.push(round3shape0, round3shape1, round3shape2, round3shape3, round3shape4);
	*/
	roundsShapes.push(round0, round1, round2, round3);
	//console.log(roundsShapes);
}

/*
 * Initialize to the first round.
 */
 
 function initializeCanvases(){
	//Create the 5 canvases to overlay
	var canvas0 = document.getElementById('canvas0');
    canvas0.setAttribute('width', mWidth);
    canvas0.setAttribute('height', mHeight);
    canvas0.style.display = SHOW_SHADOW ? 'block' : 'none';
    
    var canvas1 = document.getElementById('canvas1');
    canvas1.setAttribute('width', mWidth);
    canvas1.setAttribute('height', mHeight);
    canvas1.style.display = SHOW_SHADOW ? 'block' : 'none';
    
    var canvas2 = document.getElementById('canvas2');
    canvas2.setAttribute('width', mWidth);
    canvas2.setAttribute('height', mHeight);
    canvas2.style.display = SHOW_SHADOW ? 'block' : 'none';
    
    var canvas3 = document.getElementById('canvas3');
    canvas3.setAttribute('width', mWidth);
    canvas3.setAttribute('height', mHeight);
    canvas3.style.display = SHOW_SHADOW ? 'block' : 'none';
    
    var canvas4 = document.getElementById('canvas4');
    canvas4.setAttribute('width', mWidth);
    canvas4.setAttribute('height', mHeight);
    canvas4.style.display = SHOW_SHADOW ? 'block' : 'none';

	allCanvases.push({canvas: canvas0, isGreen: false}, 
					{canvas: canvas1, isGreen: false}, 
					{canvas: canvas2, isGreen: false},
					{canvas: canvas3, isGreen: false},
					{canvas: canvas4, isGreen: false});
	
	displayRound(currentRound);
}

/*
 * In a loop: gets the current frame of video, thresholds it to the background frames,
 * and outputs the difference as a shadow.
 */
function renderShadow() {
  	if (!background) { return; }
  	pixelData = getShadowData();  	
  	shadowContext.putImageData(pixelData, 0, 0);
  	renderShapeCanvases(pixelData);
  	setTimeout(renderShadow, 0);
}

//shapes is an array of 5 shapes
//each shape is an array of points
function renderShapeCanvases(pixelData) {
	var numGreen = 0;
	
	for (c in allCanvases) {
		var context = (allCanvases[c].canvas).getContext('2d');
		var canvasData = context.getImageData(0, 0, mWidth, mHeight);
		if (hasOverlap(pixelData, canvasData)) {
			numGreen++;
			renderShape(c, green);
		}
		else {
			numGreen--;
			renderShape(c, black);
		}
	}
	
	//console.log(getPixelsInBackground(pixelData));
	if (numGreen >= 5 && (getPixelsInBackground(pixelData) < 800)) {
		currentRound = (currentRound <= (TOTAL_ROUNDS - 1)) ? (currentRound + 1) : 0;
		displayRound(currentRound, black);
	}
}

function getPixelsInBackground(shadowData) {
	var numPixels = 0;
	var backgroundData = testContext.getImageData(0, 0, mWidth, mHeight);
	
	for (var i = 0; i < pixelData.data.length; i = i + 4){
		var bgR = (backgroundData.data[i] == 0);
		var bgG = (backgroundData.data[i+1] == 0);
		var bgB = (backgroundData.data[i+2] == 0);
		var backgroundIsBlack = (bgR && bgG && bgB && backgroundData.data[i+3] == 255);
		
		var shadowR = (shadowData.data[i] == 0);
		var shadowG = (shadowData.data[i+1] == 0);
		var shadowB = (shadowData.data[i+2] == 0);
		var shadowIsBlack = (shadowR && shadowG && shadowB && shadowData.data[i+3] == 255);
		
		if (backgroundIsBlack && shadowIsBlack) {
			numPixels++;
		}
	}
	return numPixels;
}

function initBackgroundData(){
	var thisRoundsShapes = roundsShapes[currentRound];
	for (shape in thisRoundsShapes){
		testCanvas.width = testCanvas.width;
	}
	
	testContext.beginPath();
	testContext.moveTo(0,0);
	testContext.lineTo(mWidth, 0);
	testContext.lineTo(mWidth, mHeight);
	testContext.lineTo(0, mHeight);
	testContext.fillStyle=black;
	testContext.fill();
	
	for (shape in thisRoundsShapes){
		var thisShape = roundsShapes[currentRound][shape];
		testContext.beginPath();
		for (point in thisShape) {
			if (point == 0) {
				testContext.moveTo(thisShape[point].x, thisShape[point].y);
			}
			else {
				testContext.lineTo(thisShape[point].x, thisShape[point].y);
			}
		}
		testContext.fillStyle="#ffffff";
		testContext.fill();
	}
}

function renderShape(shapeNum, color) {
	var context = (allCanvases[shapeNum].canvas).getContext('2d');
	var thisShape = roundsShapes[currentRound][shapeNum];
	
	context.beginPath();
	for (point in thisShape) {
		if (point == 0) {
				context.moveTo(thisShape[point].x, thisShape[point].y);
			}
			else {
				context.lineTo(thisShape[point].x, thisShape[point].y);
			}
	}
	context.fillStyle=color;
	context.fill();
}

function displayRound(roundNum){
	var thisRoundsShapes = roundsShapes[roundNum];
	for (shape in thisRoundsShapes){
		(allCanvases[shape].canvas).width = (allCanvases[shape].canvas).width;
	}
	for (shape in thisRoundsShapes){
		renderShape(shape, black);
	}
	
	initBackgroundData();
}


/*
Return true if you encounter a pixel where shadowData is black and shapeData is black or green
*/
function hasOverlap(shadowData, shapeData) {
	
	for (var i = 0; i < shapeData.data.length; i = i + 4){
		var shapeR = (shapeData.data[i] == 0);
		var shapeG = (shapeData.data[i+1] == 0) || (shapeData.data[i+1] == 255);
		var shapeB = (shapeData.data[i+2] == 0);
		var shapeIsBlackOrGreen = (shapeR && shapeG && shapeB && shapeData.data[i+3] == 255);
		
		if (shapeIsBlackOrGreen){
			var shadowR = (shadowData.data[i] == 0);
			var shadowG = (shadowData.data[i+1] == 0);
			var shadowB = (shadowData.data[i+2] == 0);
			if (shadowR && shadowG && shadowB && shadowData.data[i+3] == 255){
				return true;
			}
		}
	}
	return false;
}





/************************************************************
 * SCAFFOLDING
 *************************************************************/
 
 
/*
 * Starts webcam capture
 */
function setUpWebCam() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (!navigator.getUserMedia) { 
        console.log("Browser does not support getUserMedia. Try a latest version of Chrome/Firefox");
    }
    window.URL = window.URL || window.webkitURL;
    
    video.addEventListener('canplay', function() {
        if ($('#background').attr('disabled')) {
            $('#background').attr('disabled', false);
        }
    }, false);
    
    var failVideoStream = function(e) {
      console.log('Failed to get video stream', e);
    };
    
    navigator.getUserMedia({video: true, audio:false}, function(stream) {
        mediaStream = stream;
        
        if (navigator.mozGetUserMedia) {
          video.mozSrcObject = stream;
          video.play();
        } else {
          video.src = window.URL.createObjectURL(stream);
        }        
      }, failVideoStream);
}


/*
 * Creates the video and canvas elements
 */
function initializeDOMElements() {
	
    video = document.createElement('video');
    video.setAttribute('autoplay', true);
    video.style.display = 'none';
    
    rawCanvas = document.createElement('canvas');
    rawCanvas.setAttribute('id', 'rawCanvas');
    rawCanvas.setAttribute('width', mWidth);
    rawCanvas.setAttribute('height', mHeight);
    rawCanvas.style.display = SHOW_RAW ? 'block' : 'none';
    document.getElementById('canvasesdiv').appendChild(rawCanvas);
    rawContext = rawCanvas.getContext('2d');
    // mirror horizontally, so it acts like a reflection
    rawContext.translate(rawCanvas.width, 0);
    rawContext.scale(-1,1);	
    
    shadowCanvas = document.getElementById('shadowCanvas');
    shadowCanvas.setAttribute('width', mWidth);
    shadowCanvas.setAttribute('height', mHeight);
    shadowCanvas.style.display = SHOW_SHADOW ? 'block' : 'none';
    document.getElementById('canvasesdiv').appendChild(shadowCanvas);
    shadowContext = shadowCanvas.getContext('2d');
    
    testCanvas = document.getElementById('testCanvas');
    testCanvas.setAttribute('width', mWidth);
    testCanvas.setAttribute('height', mHeight);
    testCanvas.style.display = SHOW_SHADOW ? 'block' : 'none';
    testContext = testCanvas.getContext('2d');
    console.log(testCanvas);
    console.log(testContext);
}

/*
 * Returns an ImageData object that contains black pixels for the shadow
 * and white pixels for the background
 */
function getShadowData() {
    var pixelData = getCameraData();

    // Each pixel gets four array indices: [r, g, b, alpha]
    for (var i=0; i<pixelData.data.length; i=i+4) {
        var rCurrent = pixelData.data[i];
        var gCurrent = pixelData.data[i+1];
        var bCurrent = pixelData.data[i+2];
        var rBackground = background.data[i];
        var gBackground = background.data[i+1];
        var bBackground = background.data[i+2];
        		
        var distance = pixelDistance(rCurrent, gCurrent, bCurrent, rBackground, gBackground, bBackground);        
        
        if (distance >= SHADOW_THRESHOLD) {
            // foreground, show shadow
            pixelData.data[i] = 0;
            pixelData.data[i+1] = 0;
            pixelData.data[i+2] = 0;
        } else {
            //  update model of background, since we think this is in the background
            updateBackground(i, rCurrent, gCurrent, bCurrent, rBackground, gBackground, bBackground);
            
            // now set the background color
            pixelData.data[i] = 255;
            pixelData.data[i+1] = 255;
            pixelData.data[i+2] = 255;
            pixelData.data[i+3] = 0;
        }
    }   
    return pixelData; 
}

/*
 * Remembers the current pixels as the background to subtract.
 */
function setBackground() {
    var pixelData = getCameraData();
    background = pixelData;
}

/*
 * Gets an array of the screen pixels. The array is 4 * numPixels in length,
 * with [red, green, blue, alpha] for each pixel.
 */
function getCameraData() {
    if (mediaStream || kinect) {
        rawContext.drawImage(video, 0, 0, rawCanvas.width, rawCanvas.height);
        stackBlurCanvasRGB('rawCanvas', 0, 0, rawCanvas.width, rawCanvas.height, STACK_BLUR_RADIUS);        
        var pixelData = rawContext.getImageData(0, 0, rawCanvas.width, rawCanvas.height);
        return pixelData;
    }    
}

function updateBackground(i, rCurrent, gCurrent, bCurrent, rBackground, gBackground, bBackground) {
    background.data[i] = Math.round(BACKGROUND_ALPHA * rCurrent + (1-BACKGROUND_ALPHA) * rBackground);
    background.data[i+1] = Math.round(BACKGROUND_ALPHA * gCurrent + (1-BACKGROUND_ALPHA) * gBackground);
    background.data[i+2] = Math.round(BACKGROUND_ALPHA * bCurrent + (1-BACKGROUND_ALPHA) * bBackground);
}


/*
 * Returns the distance between two pixels in grayscale space
 */
function pixelDistance(r1, g1, b1, r2, g2, b2) {
    return Math.abs((r1+g1+b1)/3 - (r2+g2+b2)/3);
}

