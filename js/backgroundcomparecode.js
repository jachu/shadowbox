

//function compare() {
//	
//	//Currently, renderShadow does all of the following code. So, we don't need to press the
//	//compare button anymore. This is just a test though.
//	
//	sandContext.putImageData(pixelData, 0, 0);
//	sandData = sandContext.getImageData(0, 0, sandCanvas.width, sandCanvas.height);
//
//	if (hasOverlapTest(sandData, shapeData)) {
//		//console.log("turn shape green func");
//		turnShapeGreen(shapeData);
//	} else {
//		//console.log("turn back");
//		turnShapeBlack(shapeData);
//	}
//	
//	setTimeout(compare, 0);
//	
//	//sandContext.putImageData(shapeData, 0, 0);
//	
//	//need to compare the sandData to the shapeData
//	
//	
//	/* LAO'S SIMON SAYS COMPARE
//	console.log("pixel data data");
//	var match = true;
//	
//	for (var i = 0; i < sandData.data.length; i = i + 4) {
//		//console.log(sandData.data[i]);
//		//console.log(sandData.data[i+1]);
//		//console.log(sandData.data[i+2]);
//		var r0 = sandData.data[i] == 0;
//		var g0 = sandData.data[i+1] == 0;
//		var b0 = sandData.data[i+2] == 0;
//		var isShadow = (r0 && g0 && b0);
//		
//		if (!isShadow) {
//		
//			var r255 = doData.data[i] == 255;
//			//if (r) console.log("r match");
//			// if (!r) {
//			// 	match = false;
//			// }
//			var g255 = doData.data[i+1] == 255;
//			//if (g) console.log("r match");
//			// if (!g) {
//			// 	match = false;
//			// }
//			var b255 = doData.data[i+2] == 255;
//			//if (b) console.log("r match");
//			// if (!b) {
//			// 	match = false;
//			// }
//			
//			var isWhite = (r255 && g255 && b255);
//		
//			if (!isWhite) {
//				match = false;
//				doData.data[i] = 255;
//				doData.data[i+1] = 0;
//				doData.data[i+2] = 0;
//			}
//		}
//	}
//	if (match) {
//		console.log("match!");
//	} else {
//		console.log("no match");
//		doContext.putImageData(doData, 0, 0);
//	}
//	*/
//}