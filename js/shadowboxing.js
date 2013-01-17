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

// Student-configurable options below...

// show the after-gaussian blur camera input
SHOW_RAW = false;
// show the final shadow
SHOW_SHADOW = true;
// input option: kinectdepth (kinect depth sensor), kinectrgb (kinect camera), 
// or webcam (computer camera)
var INPUT = "webcam"; 
// A difference of >= SHADOW_THRESHOLD across RGB space from the background
// frame is marked as foreground
var SHADOW_THRESHOLD = 10;
// Between 0 and 1: how much memory we retain of previous frames.
// In other words, how much we let the background adapt over time to more recent frames
var BACKGROUND_ALPHA = 0.05;
// We run a gaussian blur over the input image to reduce random noise 
// in the background subtraction. Change this radius to trade off noise for precision 
var STACK_BLUR_RADIUS = 10; 

var mWidth = 240;
var mHeight = 180;
var compareBlack = true;


/*
 * Begin shadowboxing code
 */
var mediaStream, video, rawCanvas, rawContext, shadowCanvas, shadowContext, background = null;

var sandCanvas = null;
var sandContext = null;
var sandData = null;
var shapeCanvas = null;
var shapeData = null;
var shapeData = null;

var started = false;

$(document).ready(function() {
		
    initializeDOMElements();

    $("#background").attr('disabled', true);
	if (INPUT == "kinectdepth" || INPUT == "kinectrgb") {
		setUpKinect();
	} else if (INPUT == "webcam") {
		setUpWebCam();
	}

    $('#background').click(function() {
        setBackground();
        if (!started) {
            renderShadow();
        }
    });
    
	$('#comp').click(function() {
        compare();
    });

});

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
    document.getElementById('capture').appendChild(rawCanvas);
    rawContext = rawCanvas.getContext('2d');
    // mirror horizontally, so it acts like a reflection
    rawContext.translate(rawCanvas.width, 0);
    rawContext.scale(-1,1);    
    
    shadowCanvas = document.getElementById('shadowCanvas');
    shadowCanvas.setAttribute('width', mWidth);
    shadowCanvas.setAttribute('height', mHeight);
    shadowCanvas.style.display = SHOW_SHADOW ? 'block' : 'none';
    document.getElementById('capture').appendChild(shadowCanvas);
    shadowContext = shadowCanvas.getContext('2d');
    
    sandCanvas = document.createElement('canvas');
    sandCanvas.setAttribute('id', 'sandCanvas');
    sandCanvas.setAttribute('width', mWidth);
    sandCanvas.setAttribute('height', mHeight);
    sandCanvas.style.display = SHOW_SHADOW ? 'block' : 'none';
    document.getElementById('sandbox').appendChild(sandCanvas);
    sandContext = sandCanvas.getContext('2d');
    
    shapeCanvas = document.getElementById('shapeCanvas');
    shapeCanvas.setAttribute('width', mWidth);
    shapeCanvas.setAttribute('height', mHeight);
    shapeCanvas.style.display = SHOW_SHADOW ? 'block' : 'none';
    document.getElementById('sandbox').appendChild(shapeCanvas);
    shapeContext = shapeCanvas.getContext('2d');

	// var test = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height);
	// console.log("test");
	// console.log(test.data[0]);
	// console.log(test.data[1]);
	// console.log(test.data[2]);
	// console.log(test.data[3]);
    //draw a square for now
    var imgData=shapeContext.createImageData(100,100);
	for (var i=0;i<imgData.data.length;i+=4)
	  {
	  imgData.data[i+0]=0;
	  imgData.data[i+1]=0;
	  imgData.data[i+2]=0;
	
		//this is where a problem is
	  imgData.data[i+3]=255;
	  }
	shapeContext.putImageData(imgData,10,10);
	shapeData = shapeContext.getImageData(0, 0, shapeCanvas.width, shapeCanvas.height);
}

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

/*
 * Remembers the current pixels as the background to subtract.
 */
function setBackground() {
    var pixelData = getCameraData();
    background = pixelData;
}

/*
iterate through pixelData1, if you encounter a black pixel, check that pixel in pixelData2
if both are black, retrun true
*/
function hasOverlapTest(pixelData1, pixelData2) {	
	if (compareBlack) {
		//console.log("comparing black");
		for (var i = 0; i < pixelData2.data.length; i = i + 4) {
			var shapeR = (pixelData2.data[i] == 0);
			var shapeG = (pixelData2.data[i+1] == 0);
			var shapeB = (pixelData2.data[i+2] == 0);
			var shapePixelIsBlack = (shapeR && shapeG && shapeB && pixelData2.data[i+3] == 255);
		
			if (shapePixelIsBlack) {
				var sandR = (pixelData1.data[i] == 0);
				var sandG = (pixelData1.data[i+1] == 0);
				var sandB = (pixelData1.data[i+2] == 0);
				var sandPixelIsBlack = (sandR && sandG && sandB && pixelData1.data[i+3] == 255);
				if (sandPixelIsBlack) {
					// console.log(pixelData1.data[i]);
					// console.log(pixelData1.data[i+1]);
					// console.log(pixelData1.data[i+2]);
					// console.log(pixelData1.data[i+3]);
					//console.log("has overlap 2");
					compareBlack = false;
					return true;
				} else {
					//console.log("no overlap 2");
				}
			}
		}
	} else {
		//console.log("comparing green");
		for (var i = 0; i < pixelData2.data.length; i = i + 4) {
			var shapeR = (pixelData2.data[i] == 0);
			var shapeG = (pixelData2.data[i+1] == 255);
			var shapeB = (pixelData2.data[i+2] == 0);
			var shapePixelIsGreen = (shapeR && shapeG && shapeB && pixelData2.data[i+3] == 255);
		
			if (shapePixelIsGreen) {
				var sandR = (pixelData1.data[i] == 0);
				var sandG = (pixelData1.data[i+1] == 0);
				var sandB = (pixelData1.data[i+2] == 0);
				var sandPixelIsBlack = (sandR && sandG && sandB && pixelData1.data[i+3] == 255);
				if (sandPixelIsBlack) {
					// console.log(pixelData1.data[i]);
					// console.log(pixelData1.data[i+1]);
					// console.log(pixelData1.data[i+2]);
					// console.log(pixelData1.data[i+3]);
					//console.log("has overlap 3");
					return true;
				} else {
					//console.log("no overlap 3");
				}
			}
		}
	}
	compareBlack = true;
	return false;
	
	//shapeContext.putImageData(pixelData2, 0, 0);
}

function turnShapeGreen(shpData) {
	for (var i = 0; i < shpData.data.length; i += 4) {
		var shapeR = (shpData.data[i+0] == 0);
		var shapeG = (shpData.data[i+1] == 0);
		var shapeB = (shpData.data[i+2] == 0);
		var shapeA = (shapeData.data[i+3] == 255);
		
		var shapePixelIsBlack = (shapeR && shapeG && shapeB && shapeA);
		if (shapePixelIsBlack) {
		 	shpData.data[i+0]=0;
		  	shpData.data[i+1]=255;
		  	shpData.data[i+2]=0;
		  	shpData.data[i+3]=255;
		}
	}
	shapeContext.putImageData(shpData,10,10);
}

function turnShapeBlack(shpData) {
	for (var i = 0; i < shpData.data.length; i += 4) {
		var shapeR = (shpData.data[i+0] == 0);
		var shapeG = (shpData.data[i+1] == 255);
		var shapeB = (shpData.data[i+2] == 0);
		var shapeA = (shapeData.data[i+3] == 255);
		
		var shapePixelIsGreen = (shapeR && shapeG && shapeB && shapeA);
		if (shapePixelIsGreen) {
		 	shpData.data[i+0]=0;
		  	shpData.data[i+1]=0;
		  	shpData.data[i+2]=0;
		  	shpData.data[i+3]=255;
		}
	}
	shapeContext.putImageData(shpData,10,10);
}

function compare() {
	
	//Currently, renderShadow does all of the following code. So, we don't need to press the
	//compare button anymore. This is just a test though.
	
	sandContext.putImageData(pixelData, 0, 0);
	sandData = sandContext.getImageData(0, 0, sandCanvas.width, sandCanvas.height);

	if (hasOverlapTest(sandData, shapeData)) {
		//console.log("turn shape green func");
		turnShapeGreen(shapeData);
	} else {
		//console.log("turn back");
		turnShapeBlack(shapeData);
	}
	
	setTimeout(compare, 0);
	
	//sandContext.putImageData(shapeData, 0, 0);
	
	//need to compare the sandData to the shapeData
	
	
	/* LAO'S SIMON SAYS COMPARE
	console.log("pixel data data");
	var match = true;
	
	for (var i = 0; i < sandData.data.length; i = i + 4) {
		//console.log(sandData.data[i]);
		//console.log(sandData.data[i+1]);
		//console.log(sandData.data[i+2]);
		var r0 = sandData.data[i] == 0;
		var g0 = sandData.data[i+1] == 0;
		var b0 = sandData.data[i+2] == 0;
		var isShadow = (r0 && g0 && b0);
		
		if (!isShadow) {
		
			var r255 = doData.data[i] == 255;
			//if (r) console.log("r match");
			// if (!r) {
			// 	match = false;
			// }
			var g255 = doData.data[i+1] == 255;
			//if (g) console.log("r match");
			// if (!g) {
			// 	match = false;
			// }
			var b255 = doData.data[i+2] == 255;
			//if (b) console.log("r match");
			// if (!b) {
			// 	match = false;
			// }
			
			var isWhite = (r255 && g255 && b255);
		
			if (!isWhite) {
				match = false;
				doData.data[i] = 255;
				doData.data[i+1] = 0;
				doData.data[i+2] = 0;
			}
		}
	}
	if (match) {
		console.log("match!");
	} else {
		console.log("no match");
		doContext.putImageData(doData, 0, 0);
	}
	*/
}

/*
 * In a loop: gets the current frame of video, thresholds it to the background frames,
 * and outputs the difference as a shadow.
 */
function renderShadow() {
  	if (!background) {
    	return;
  	}
  
  	pixelData = getShadowData();
  	
  	//put logic to color the pixels that have overlap here
  	
  	shadowContext.putImageData(pixelData, 0, 0);

	//We can combine buttons. This is test code.
	//sandContext.putImageData(pixelData, 0, 0);
	//sandData = sandContext.getImageData(0, 0, sandCanvas.width, sandCanvas.height);

	//if (hasOverlapTest(sandData, shapeData)) {
	if (hasOverlapTest(pixelData, shapeData)) {
		//console.log("turn shape green func");
		turnShapeGreen(shapeData);
	} else {
		//console.log("turn back");
		turnShapeBlack(shapeData);
	}
	//End of test code.

  	setTimeout(renderShadow, 0);
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
            // background
            
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