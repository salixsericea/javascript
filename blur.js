/* Do whatever you like with this.*/
 

// Keep everything in anonymous function, called on window load.
if(window.addEventListener) {
window.addEventListener('load', function () {
  var canvas, canvaso, contexto;
  var dataMaxWidth=800;
  var dataMaxHeight=600;
  var mouseX=0; mouseY=0;
  var peelingStarted = false;
  var drawingLineWidth=this.document.getElementById("lineWidth").value;;
  //var drawingLineColor="#000000";
  var drawingLineColor=this.document.getElementById("lineColor").value;
  var myVar=null;
  // where to clip
  var yPeelArray=[];
  // set a single font size 
  var ctFont='16pt Arial';

  // The active tool instance.
  var tool;
  var tool_default = 'line';

  let model;
let previousPen = "down";
// Current location of drawing
let x=0;
let y=0;
// The current "stroke" of the drawing
let strokePath;
let context;
let penWatch=false;


  function init () {
    model = ml5.sketchRNN('cat', modelReady);
 
     
 
	document.getElementById('barProgress').style.display = "none";
    // Find the canvas element.
    canvaso = document.getElementById('imageView');
 
    // Get the 2D canvas context.
    contexto = canvaso.getContext('2d');
  
    // Add the temporary canvas.
    var container = canvaso.parentNode;
    canvas = document.createElement('canvas');
 
    canvas.id     = 'imageTemp';
	canvas.tabindex=1;
    canvas.width  = canvaso.width;
    canvas.height = canvaso.height;
    container.appendChild(canvas);

    context = canvas.getContext('2d');
	context.lineWidth = drawingLineWidth;
    context.strokeStyle=drawingLineColor;  // line strokes
	context.fillStyle=drawingLineColor; // text color
	
	contexto.fillStyle = 'rgb(255,255,255)';
    contexto.fillRect(0, 0, canvaso.width, canvaso.height);

    // Get the tool select input.
    var tool_select = document.getElementById('dtool');
  
    tool_select.addEventListener('change', ev_tool_change, false);

    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      tool_select.value = tool_default;
    }

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup',   ev_canvas, false);
	
	 // dropZone event handlers
    var dropZone=document.getElementById("imageTemp");
    dropZone.addEventListener("dragenter", handleDragEnter, false);
    dropZone.addEventListener("dragover", handleDragOver, false);
    dropZone.addEventListener("drop", handleDrop, false);
    //
    function handleDragEnter(e){e.stopPropagation(); e.preventDefault();}
    //
    function handleDragOver(e){e.stopPropagation(); e.preventDefault();}
    //
	
	
	// element event listenes
    document.getElementById('lineColor').addEventListener('input', changeLineColor, false);	
	document.getElementById('fileinput').addEventListener('change', readMultipleFiles, false);
	document.getElementById('btnMove').addEventListener('click', btnMovetext, false);
    document.getElementById('btnSave').addEventListener('click', btnSave, false);
    document.getElementById('btnClear').addEventListener('click', clear, false);	
	document.getElementById('container').addEventListener('keydown',  keyDown, true);
    document.getElementById('btnStartauto').addEventListener('click', btnStart, false);		
    document.getElementById('lineWidth').addEventListener('input', changeLineWidth, false);		
    document.getElementById('btnPeel').addEventListener('click', peel, false);	
    document.getElementById('transparency').addEventListener('click', changeTransparency, false);		
    document.getElementById('btnTest').addEventListener('click', testOCR, false);	 	
 			
	
  }
  
  
  function handleDrop(e){
        e.stopPropagation();
        e.preventDefault();
        //
        var url=e.dataTransfer.getData('text/plain');
        // for img elements, url is the img src so 
        // create an Image Object & draw to canvas
        if(url){
            var img=new Image();
            img.onload=function(){context.drawImage(this,0,0);}
            img.src=url;
        // for img file(s), read the file & draw to canvas
        }else{
           handleFiles(e.dataTransfer.files);
        }
    } 
    // read & create an image from the image file
    function handleFiles(files) {
		//alert(files + files.length);
        for (var i=0;i<files.length;i++) {
          var file = files[i];
          var imageType = /image.*/;
          if (!file.type.match(imageType)){continue;}
          var img = document.createElement("img");
          img.classList.add("obj");
          img.file = file;
          var reader=new FileReader();
          reader.onload=(function(aImg){
              return function(e) {
                  aImg.onload=function(){
                      context.drawImage(aImg,0,0);
					  img_update();
                  }
                  // e.target.result is a dataURL for the image
                  aImg.src = e.target.result;
              }; 
          })(img);
          reader.readAsDataURL(file);      
        } // end for
    } // end handleFiles
	
// set the transparency globalAlpha for the top canvas "context"  
function changeTransparency()
{
context.globalAlpha=transparency.value;	
}  

// split image by copying some onto the top canvas
// after this, we can save the two separately
function peel() {
    // temporarily set to non-transparent
	var contextTransparent=context.globalAlpha;	
	context.globalAlpha=1;
	peelingStarted = true;
	var blocksize = 20;
	var font=7; // half the fontsize for peeling to get a line nicely cut in half
	y = 0;
	x=0;
	contexto.fillStyle = 'rgb(255,255,255)';
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	/* we get into trouble loading two large images, so we leave this alone for now
	// if yPeelArray.length is 0, user did not move any text onto the canvas
	// that's either a mistake or user just wants to split an image
	// so, we are nice and make a new array that works for whatever canvas content exists
	
	if (yPeelArray.length==0)
		yPeelArray=makePeelArray(yPeelArray); //it is global but hey
    */
   
   
		for (y = 0; y < yPeelArray.length; y++) {

			console.log("Block " + x + "   y" + yPeelArray[y]);	
			context.drawImage(canvaso, 0, yPeelArray[y]-font, canvas.width, blocksize, 0, yPeelArray[y]-font, canvas.width, blocksize);
			console.log("Block " + x + "   y" + yPeelArray[y] + "width "+ canvas.width+ "ehight:"+  blocksize);	
			contexto.fillRect(0, yPeelArray[y]-font, canvas.width, blocksize);
			//contexto.clearRect(0, yPeelArray[y]-font, canvas.width, blocksize);

	}

	alert("Your image is now split into 2 peeled images.\n \nUse Export to file twice to save both images." +
			"\n \nTo restore the image, simply load one image after the other into MessageBlur.");
			
	context.globalAlpha=contextTransparent;	
}  

function makePeelArray(yPeelArray){
	for (var i= 50; i < canvas.height-100; i=i+50 )
	  yPeelArray.push(i);
  return yPeelArray;
}


  // set the width of lines
  	function changeLineWidth(event){
	   drawingLineWidth=parseInt(event.target.value);
	   context.lineWidth = drawingLineWidth;
	}	
  
  // toggle the random drawing feature
  // run this through setInterval
  // using an interval of 200 for ML5
  function btnStart(){
  if (myVar == null){
    var selector = document.getElementById('dtool');
    if (selector[selector.selectedIndex].value == 'pencil'){
      penWatch=true;
      myVar = setInterval(line, 200); 
  } 
  else
	  myVar = setInterval(line, 500); 
    document.getElementById('btnStartauto').textContent="Stop random drawing"; 	
    
    
	  }	
  else{
	clearInterval(myVar); 
  penWatch=false;	
    img_update();	
	myVar=null;
	document.getElementById('btnStartauto').textContent="Start random drawing"; 
  }
  } 
  

  // use a buttin instead of a visible link
  function btnSave(){
	  
	var a = document.createElement('a');
  	    //a.href = window.URL.createObjectURL(blob);
		 a.href = document.getElementById(canvaso.getAttribute("id")).toDataURL();
	    document.body.appendChild(a);
	    a.download = "blur.png";
        a.click();	  
		
		       if (peelingStarted) {
                    peelingStarted = false;
				   contexto.clearRect(0, 0, canvas.width, canvas.height); 	
                   contexto.fillRect(0, 0, canvas.width, canvas.height);
                  img_update();
                }
	  
  }
  

  // randomly draw lines and circles
     function line() {
		    //check the selection box
			var selector = document.getElementById('dtool');
			var value = selector[selector.selectedIndex].value;
		 
      if (!penWatch){
			x = Math.floor(Math.random() * canvas.width);
			y = Math.floor(Math.random() * canvas.height);
			x2 = Math.floor(Math.random() * canvas.width);
			y2 = Math.floor(Math.random() * canvas.height);
      }
      
      console.log ("tool is " + value + "penwatch is "+penWatch);
			      
			r = Math.floor(Math.random() * 255);
			g = Math.floor(Math.random() * 255);
			b = Math.floor(Math.random() * 255);

      if (penWatch){
        r=g=b=255;
        context.lineWidth= drawingLineWidth;
      }
      else{
			context.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
			context.lineWidth = Math.floor(Math.random() * drawingLineWidth);
      }

						
			//draw line, circle, or rectangle
			context.beginPath();
		
			//context.moveTo(x, y);
			// this will exceed the canvas and show a message in the console
			// no reason to worry and is much nicer
			if (value=="circle")
				context.arc(x, y, y2 - x2, 0, 2 * Math.PI, false);
			else if (value=="rect")	
				 context.rect(x/2, y/2, x2/2, y2/2);	
			else if ( value=="line"){	 
			      context.moveTo(x, y);
				  context.lineTo(x2, y2);
				 
			}
			else if (value=="pencil"){
			  /* this is the part where we ask ML5 to get us one 
        image stroke after the other. Instead of using callbacks we
        use the Promise version of model.generate to get one
        stroke for each invocation of the line () function
        via setInterval. */
        
          if (strokePath==null){
          model.reset();
          penWatch=true;
          console.log("resetting");
          }
          
          // Generate a stroke path
          model.generate().then(result => {
            console.log(`Got the final result: ${result}`);
            strokePath=result;
           // draw(strokePath);
           if (strokePath) {
            console.log(`drawing: ${strokePath}`);
            // If the pen is down, draw a line
            scaledx=strokePath.dx * 0.5;
            scaledy=strokePath.dy * 0.5;
        
          if (previousPen === "down") {
              context.beginPath();
              context.lineCap = "round";
              context.moveTo(x, y);
              context.lineTo(x + scaledx, y + scaledy);
              context.stroke();
           }
            // Move the pen
            x += scaledx;
            y += scaledy;
            // The pen state actually refers to the next stroke
            previousPen = strokePath.pen;
        
            // If the drawing is complete
            if (strokePath.pen == "end") {
              strokePath = null;
              penWatch=false;
              console.log("reset penwatch in draw function");
             //  model.generate(gotStroke);
             
            }
          }
           
          });
                    
         // draw();
				
			}
				  
			context.closePath();
			context.stroke();
		}

  
// the "move to box" function
function btnMovetext() {
		// end temp
		var maxWidth = canvas.width - 100;

		var x = 30;
		var y = 40;
		var lineHeight= 34;
		yPeelArray=[];

		var msg = document.getElementById("message");
		var text = msg.value;

		context.font = ctFont;
	   // context.fillStyle = '#333';

		// var words = text.split(' ');
		var line = '';

		for (var n = 0; n < text.length; n++) {
			var testLine = line + text[n];

			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;
			

			if (text[n] == "\n") {
				testWidth = maxWidth + 1;
			}

			if (testWidth > maxWidth && n > 0) {

				context.fillText(line, x, y); 	yPeelArray.push(y);
				line = text[n];
				y += lineHeight;
			
			} else {
				line = testLine;
			}
		}
		context.fillText(line, x, y);
		img_update();
		//alert (text);

}
  // keyboard input over the canvas
   function keyDown(e){
   var line = String.fromCharCode(e.keyCode); 
	if(e.keyCode!=16){ // If the pressed key is anything other than SHIFT
        
        if(e.shiftKey){ // If the SHIFT key is down, return the ASCII code for the capital letter
           // alert("ASCII Code: "+e.keyCode+" Character: "+line);
        }else{ // If the SHIFT key is not down, convert to the ASCII code for the lowecase letter
            line = line.toLowerCase(line);
           // alert("ASCII Code: "+line.charCodeAt(0)+" Character: "+line);
        }
  }
	
	context.font = ctFont;
	var metrics = context.measureText(line);
    var testWidth = metrics.width;
    context.fillText(line, mouseX, mouseY);
	mouseX=mouseX+testWidth;
	img_update();

   };
   
   
  function readMultipleFiles(evt) {
    //Retrieve all the files from the FileList object
    var files = evt.target.files; 
	  contexto.globalCompositeOperation = "source-over";
   
   // temporarily set to non-transparent
	var contextTransparent=context.globalAlpha;	
	context.globalAlpha=1;
    if (files) {
		for (var i=0, f; f=files[i]; i++) {
       
			if (files.length > 1){
              contexto.globalCompositeOperation = "difference";
			//alert("Loading more than one image");
			}
			//  img_update();
			  
	        var r = new FileReader();
            r.onload = (function(f) {
                return function(e) {
					
                  var mac = e.target.result;
		          var img = new Image();
				img.onloadend = function() {
					
			    var scaled = getScaledDim(img, context.canvas.dataMaxWidth, context.canvas.dataMaxHeight);
                    // scale canvas to image
                    context.canvas.width = scaled.width;
                    context.canvas.height = scaled.height;	
					dataMaxWidth=scaled.width;
					dataMaxHeight== scaled.height;	
			        if (contexto.canvas.width > context.canvas.width || contexto.canvas.width < context.canvas.width
                            || contexto.canvas.height > context.canvas.height || contexto.canvas.height < context.canvas.height) {

                        // alert("canvas size reset");
                        contexto.canvas.width = scaled.width;
                        contexto.canvas.height = scaled.height;


                    }	
				
				
			     contexto.drawImage(img, 0, 0);
				
				
               };
               img.src = mac;
					  
					
                };
            })(f);

            //r.readAsText(f);
			r.readAsDataURL(f);
        }   
    } else {
	      alert("Failed to load files"); 
    }
                contexto.fillStyle = 'rgb(255,255,255)';
                contexto.fillRect(0, 0, canvaso.width, canvaso.height);
				context.globalAlpha=contextTransparent;	
  }
  
// reset   
function clear(){
		canvas.width=dataMaxWidth; canvas.height=dataMaxHeight; 
		canvaso.width=dataMaxWidth; canvaso.height=dataMaxHeight; 
		contexto.save();
		contexto.fillStyle = 'rgb(255,255,255)';
		contexto.fillRect(0, 0, canvaso.width, canvaso.height);
	    contexto.clearRect(0, 0, canvaso.width, canvaso.height);	
		contexto.restore();
		
		contexto.globalCompositeOperation = "source-over"; 
}
  
 
  // scaling
function getScaledDim(img, maxWidth, maxHeight) {
		var scaled = {
			ratio: img.width / img.height,
			width: img.width,
			height: img.height
		}
		if (scaled.width > maxWidth || scaled.width < maxWidth) {
			scaled.width = maxWidth;
			scaled.height = scaled.width / scaled.ratio;
		}
		if (scaled.height > maxHeight || scaled.height < maxHeight) {
			scaled.height = maxHeight;
			scaled.width = scaled.height / scaled.ratio;
		}

		return scaled;
	}

 
  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.
  function ev_canvas (ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

	document.getElementById("coordinates").innerHTML = "X: " + ev._x + " Y: " + ev._y;
	mouseX=ev._x; mouseY=ev._y;
    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  // The event handler for any changes made to the tool selector.
  function ev_tool_change (ev) {
    if (tools[this.value]) {
      tool = new tools[this.value]();
    }
  }

  // set the color on temp canvas
  function changeLineColor(event){
	   context.strokeStyle=event.target.value;  // line strokes
	   context.fillStyle=event.target.value; // text color
	   drawingLineColor=event.target.value;
	   console.log(event.target.value);
	}		
  
  
  // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.
  function img_update () {
		contexto.drawImage(canvas, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
  }

  // This object holds the implementation of each drawing tool.
  var tools = {};

  // The drawing pencil.
  tools.pencil = function () {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function (ev) {
        context.beginPath();
        context.moveTo(ev._x, ev._y);
        tool.started = true;
    };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
    this.mousemove = function (ev) {
      if (tool.started) {
        context.lineTo(ev._x, ev._y);
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    //  x=ev._x; y=ev._y;
    };
  };

 // The circle tool.
  tools.circle = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

	 var x = Math.min(ev._x,  tool.x0),
          y = Math.min(ev._y,  tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);
		  
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.moveTo(tool.x0, tool.y0);
	  
      context.beginPath();
	  context.arc(x, y, w, 0, 2 * Math.PI, false);
	  
	  if (document.getElementById("solidShapes").checked)
		   context.fill();
	  else 
      context.stroke();
  
      context.closePath();
	  
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  
  // The rectangle tool.
  tools.rect = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      var x = Math.min(ev._x,  tool.x0),
          y = Math.min(ev._y,  tool.y0),
          w = Math.abs(ev._x - tool.x0),
          h = Math.abs(ev._y - tool.y0);

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!w || !h) {
        return;
      }

	  if (document.getElementById("solidShapes").checked)
		   context.fillRect(x, y, w, h);
	  else 
      context.strokeRect(x, y, w, h);
	 
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  // the text tool functiion
   tools.text = function () {
    var tool = this;
    this.started = false;

    this.mousemove = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
      }
   };
  
 
   
  // The line tool.
  tools.line = function () {
    var tool = this;
    this.started = false;

    this.mousedown = function (ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function (ev) {
      if (!tool.started) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.moveTo(tool.x0, tool.y0);
      context.lineTo(ev._x,   ev._y);
      context.stroke();
      context.closePath();
    };

    this.mouseup = function (ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  

  var CLIPBOARD = new CLIPBOARD_CLASS("imageTemp", true);

/** THANK YOU STACKOVERFLOW  https://jsfiddle.net/KJW4E/905/
 * image pasting into canvas
 * 
 * @param {string} canvas_id - imageTemp
 * @param {boolean} autoresize - if canvas will be resized
 */
function CLIPBOARD_CLASS(canvas_id, autoresize) {
	var _self = this;
	//var canvas = document.getElementById(canvas_id);
	//var context = document.getElementById(canvas_id).getContext("2d");

	//handlers
	document.addEventListener('paste', function (e) { _self.paste_auto(e); }, false);

	//on paste
	this.paste_auto = function (e) {
		if (e.clipboardData) {
			var items = e.clipboardData.items;
			if (!items) return;
			
			//access data directly
			for (var i = 0; i < items.length; i++) {
				
				if (items[i].type.indexOf("image") !== -1) {
					//image
					var blob = items[i].getAsFile();
					var URLObj = window.URL || window.webkitURL;
					var source = URLObj.createObjectURL(blob);
					//alert(blob.size);
					this.paste_createImage(source);
				} 

			}
			e.preventDefault();
		}
	};
	//draw pasted image to canvas
	this.paste_createImage = function (source) {
		var pastedImage = new Image();
		pastedImage.onload = function () {
			if(autoresize == true){
				//resize
				canvas.width = pastedImage.width;
				canvas.height = pastedImage.height;
			    canvaso.width = pastedImage.width;
				canvaso.height = pastedImage.height;
				dataMaxWidth=canvas.width;
			    dataMaxHeight==canvas.height;	
			}
			else{
				//clear canvas
				context.clearRect(0, 0, canvas.width, canvas.height);
			}
			context.drawImage(pastedImage, 0, 0);
			img_update();
		};
		pastedImage.src = source;
	};
}
  
  
  init();

}, false); 


}

  
/* new test feature with Tesseract we run script detection firs,
 then call the recognize function with the script options
 if we don't have the language in the switch statement, 
we set to nothing, which means english
*/
function testOCR(){
var detresult;
	document.getElementById('barProgress').style.display = "block";
	
	Tesseract.detect(document.getElementById('imageView'))
      .then(function (result) { console.log('detect result', result);
       detresult=result.script; 
	  // alert(detresult);
	   rec(detresult);
	  }	 
	  )
	  .catch(function(result){console.log('error is: ', result); alert(result);
			document.getElementById('barProgress').style.display = "none";  })	
 
}  

// grab the text
function rec(scr){
	
switch (scr)
{
   case 'Japanese' : scr='jpn';
   break;
   case 'Korean' : scr='kor';
   break; 
   case 'Devanagari' : scr='hin';
   break;
   case 'Cyrillic' : scr='rus';
   break;
   case 'Arabic' : scr='ara';
   break;
   case 'Hebrew' : scr='heb';
   break; 

   default: scr='eng';
}

	
	Tesseract.recognize(document.getElementById('imageView'), scr)
        .then(function(result){console.log('result is: ', result); //alert(result.text);
			document.getElementById('barProgress').style.display = "none";  
	       var content = "<html><head> <meta charset='utf-8'></head><pre>"+result.text+"</pre></html>"; // the body of the new file...
		   var blob = new Blob([content], { type: "text/html"});
	 	   var a = document.createElement('a');
  	       a.href = window.URL.createObjectURL(blob);
	       document.body.appendChild(a);
	       a.download = "Detected.html";
           a.click();	
			
			})
		.catch(function(result){console.log('error is: ', result); alert(result);
			document.getElementById('barProgress').style.display = "none";  })	
}

function modelReady() {
  console.log('SketchRNN Model Loaded!');
}
