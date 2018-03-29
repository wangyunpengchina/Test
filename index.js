global.THREE = require("./libs/three.js");

// Create a DOM
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();
global.document = MockBrowser.createDocument();
global.window = MockBrowser.createWindow();
global.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;

//global.Zlib = require("zlib-sync");
global.Zlib = require("zlib");
//global.Zlib = require('./libs/node-zlib.js');
//Zlib.Inflate = require("./libs/inflate.min.js");
//global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//require('three-fbx-loader')(THREE)

//require("./libs/inflate.min.js");
require("./libs/Detector.js");
require("./libs/LoaderSupport.js");
require("./libs/OBJLoader2.js");
require("./libs/OBJLoader.js");
require("./libs/MTLLoader.js");
//require("./libs/FBXLoader.js");
//require("./libs/CanvasRenderer.js");
//const Canvas = require('canvas');
//const canvas = new Canvas(parseInt(512,10), parseInt(512,10));

require("./libs/Projector.js");
require("./libs/controls/OrbitControls.js");
var Stats = require("./libs/stats.min.js");
var fs = require("fs");

var bmp = require("bmp-js");
var streamToBuffer = require('stream-to-buffer')

//REST API
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var router = express.Router();
var JPEGEncoder = require('jpg-stream/encoder');
var jpeg = require('jpeg-js');
var ColorTransform = require('color-transform');

const easyMonitor = require('easy-monitor');
easyMonitor('Test');

var assign = require('object-assign');
var Readable = require('readable-stream').Readable;

var width = 512;
var height = 512;

var gl = require('gl')(width, height, { preserveDrawingBuffer: true })

var pngStream = require('three-png-stream');
var port = process.env.PORT || 8888;

var mixers = [];
//var stats = new Stats();
var clock = new THREE.Clock();

var response, camera, scene, renderer, target, _canvas;
var inited = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, width / height, 100, 50000 );
    camera.position.set( 2000, 30000, 3000 );
    scene.add(camera);

    //add controls
    var controls = new THREE.OrbitControls( camera );
    controls.target.set( 0, 100, 0 );
    controls.update();

    var light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    light.position.set( 0, 200, 0 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 200, 100 );
    light.castShadow = true;
    light.shadow.camera.top = 180;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.left = -120;
    light.shadow.camera.right = 120;
    scene.add( light );

    //load fbx model file
/*
    var request = new XMLHttpRequest();

    request.open('GET', '/resources/models/NA.fbx', true);
    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200 ) {
                console.log('successful');
                var headers = request.getAllResponseHeaders().toLowerCase();
                console.log(headers);

                var test = request.response;
                console.log(test);
            } else {
                console.log('failed');
            }
        }
    };
    request.send(null);
*/
/*
    var loader = new THREE.FBXLoader();

    loader.load('/resources/models/NA_binary.fbx', function (geometry) {
        var material = new THREE.MeshNormalMaterial();
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh)
    })
*/
/*
    var loader = new THREE.OBJLoader();

    loader.load(
        // resource URL
        '/resources/models/TestObj.obj',
        // called when resource is loaded
        function ( object ) {

            scene.add( object );

        },
        // called when loading is in progresses
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );

        }
    );
    */

/*
    renderer = new THREE.CanvasRenderer({
        canvas: canvas
    });
*/
    renderer = new THREE.WebGLRenderer({context:gl});
    renderer.setSize(width, height);
    renderer.setClearColor(0xaaaabb, 1);
    renderer.shadowMap.enabled = true;

    target = new THREE.WebGLRenderTarget(width, height);
/*
    target = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });
*/

    var objLoader = new THREE.OBJLoader2();

    var callbackOnLoad = function ( event ) {
        scene.add( event.detail.loaderRootNode );
    };
//    loader.load( '/resources/models/TestObj.obj', callbackOnLoad, null, null, null, false );

    var onLoadMtl = function ( materials ) {
 //       objLoader.setModelName( modelName );
        objLoader.setMaterials( materials );
        objLoader.getLogger().setDebug( true );
        objLoader.load( '/resources/models/TestObj.obj', callbackOnLoad, null, null, null, false );
    };
    objLoader.loadMtl( '/resources/models/TestObj.mtl', null, onLoadMtl );
}

app.get('/api', function(req, res){
    response = res;

    if(!inited)
    {
        init();
        inited = true;
    }
//    setInterval(animate,33,"Interval");

    //process animation
    myCameraTween(camera,360,3600,100);

 //   response.setHeader('Content-Type', 'image/png');
    renderer.render(scene, camera, target);

    // now you can write it to a new PNG file
/*
    var output = fs.createWriteStream('image.png');

    output.once('error', err => {
        console.error(err);
});
    output.on('close', function () {
        output.end();

        fs.readFile('image.png','binary',function(err, file) {
            if (err) {
                console.log(err);
                return;
            } else {
                response.setHeader("Access-Control-Allow-Origin", "*");
         //       response.writeHeader(200, {'Content - Type': 'image/png'});
                response.write(file,'binary')
                response.end();

            }
        })

    })
*/


    var stream = getRenderData(renderer, target);

    // stream.on('end', function () {
    //     response.end();
    // })

    response.setHeader("Access-Control-Allow-Origin", "*");
   // stream.pipe(new JPEGEncoder({ width: width, height: height, quality: 80 })).pipe(response);
   const inflate = Zlib.createDeflate();

   var streaminflat = stream.pipe(inflate);

    streaminflat.on('end', function () {
        response.end();
    })

   streaminflat.pipe(response);

    //  var frameData = new Buffer(width * height * 4);
   //
   //  var rawImageData = {
   //      data: frameData,
   //      width: width,
   //      height: height
   //  };
   //
   //  var streamRead =
   //
   //      streamToBuffer(stream, function (err, buffer) {
   //          var bmpData={data:buffer,width:width,height:height}
   //          var rawData = bmp.encode(bmpData);
   //
   //          response.write(rawData.data,'binary');
   //          response.end();
   //      })

    // stream.on("data", function (chunk) {
    //     frameData = chunk;
    // });
    // stream.on("end", function () { resolve(Buffer.concat(rawImageData)); });
    //
    // stream.on('close', function () {
    //     var jpegImageData = jpeg.encode(rawImageData, 50);
    //     jpegImageData.pipe(response);
    // })




  //    response.setHeader('Content-Type', 'image/png');
  //    pngStream(renderer, target).pipe(output);
      //response.end();

    // response.setHeader('Content-Type', 'image/png');
    // response.writeHeader(200, "OK");
    // response.write(pngStream(renderer, target), "binary");
    // response.end();
});


function animate() {

    if ( mixers.length > 0 ) {

        for ( var i = 0; i < mixers.length; i ++ ) {

            mixers[ i ].update( clock.getDelta() );
        }
    }

   // renderer.render( scene, camera );

    /*
    var out = fs.createWriteStream("./test-out.png");
    var canvasStream = _canvas.pngStream();

    canvasStream.on('error', function (error) {
        console.log(error);
    });
    canvasStream.on("data", function (chunk) {
        out.write(chunk);
    });
    canvasStream.on("end", function () { console.log("done"); });
    */
    renderer.render( scene, camera, target );

    /*
    var output = fs.createWriteStream('image.png')
    pngStream(renderer, target)
        .pipe(output);
       */

 //   response.setHeader('Content-Type', 'image/png');
 //   pngStream(renderer, target).pipe(response);
 //   response.send();

  //  stats.update();
}

function myCameraTween(camera, angle, segs, during) {

    var x = camera.position.x;
    var y = camera.position.y;
    var z = camera.position.z;


    var endPosArray = new Array();

    var perAngle = angle / segs;

    for (var i = 1 ; i <= segs ; i++) {
        var endPos = { "x": z * Math.sin(i * perAngle) + x * Math.cos(i * perAngle), "y": y, "z": z * Math.cos(i * perAngle) - x * Math.sin(i * perAngle) };

        endPosArray.push(endPos);
    }


    var flag = 0;
    var id = setInterval(function () {
        if (flag == segs) {
            clearInterval(id);
        } else {
            camera.position.x = endPosArray[flag].x;
            camera.position.y = endPosArray[flag].y;
            camera.position.z = endPosArray[flag].z;

            flag++;
        }

    }, during / segs);
}
function getGLFormat (gl, format) {
    switch (format) {
        case THREE.RGBFormat: return gl.RGB
        case THREE.RGBAFormat: return gl.RGBA
        case THREE.LuminanceFormat: return gl.LUMINANCE
        case THREE.LuminanceAlphaFormat: return gl.LUMINANCE_ALPHA
        case THREE.AlphaFormat: return gl.ALPHA
        default: throw new TypeError('unsupported format ' + format)
    }
}


function getRenderData(renderer, target, opt) {
    if (typeof THREE === 'undefined') throw new Error('THREE is not defined in global scope')
    if (!renderer || typeof renderer.getContext !== 'function') {
        throw new TypeError('Must specify a ThreeJS WebGLRenderer.')
    }

    var gl = renderer.getContext()
    if (!target) {
        throw new TypeError('Must specify WebGLRenderTarget,\npopulated with the contents for export.')
    }

    opt = opt || {}
    var format = opt.format
    if (!format && target.texture && target.texture.format) {
        format = target.texture.format
    } else if (!format) {
        format = target.format
    }

    var glFormat = getGLFormat(gl, format)
    var shape = [ target.width, target.height ]

    var framebuffer = target.__webglFramebuffer
    if (!framebuffer) {
        if (!renderer.properties) {
            throw new Error(versionError)
        }
        var props = renderer.properties.get(target)
        if (!props) throw new Error(versionError)
        framebuffer = props.__webglFramebuffer
    }

    opt = assign({
        flipY: true
    }, opt, {
        format: glFormat
    })

    var stream = glPixelStream(gl, framebuffer, shape, opt);
    return stream;
}

function glPixelStream (gl, fboHandle, size, opt) {
    if (!gl) {
        throw new TypeError('must specify gl context')
    }
    if (typeof fboHandle === 'undefined') {
        throw new TypeError('must specify a FrameBufferObject handle')
    }
    if (!Array.isArray(size)) {
        throw new TypeError('must specify a [width, height] size')
    }

    opt = opt || {}
    var DEFAULT_CHUNK_SIZE = 128;
    var width = Math.floor(size[0])
    var height = Math.floor(size[1])
    var flipY = opt.flipY
    var format = opt.format || gl.RGBA
    var stride = typeof opt.stride === 'number'
        ? opt.stride : guessStride(gl, format)
    var chunkSize = typeof opt.chunkSize === 'number'
        ? opt.chunkSize : DEFAULT_CHUNK_SIZE
    var onProgress = opt.onProgress

    // clamp chunk size
    chunkSize = Math.min(Math.floor(chunkSize), height)

    var totalChunks = Math.ceil(height / chunkSize)
    var currentChunk = 0
    var stream = new Readable()
    stream._read = read
    return stream

    function read () {
        if (currentChunk > totalChunks - 1) {
            return process.nextTick(function () {
                stream.push(null)
            })
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, fboHandle)
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            var self = this
            return process.nextTick(function () {
                self.emit('error', new Error('Framebuffer not complete, cannot gl.readPixels'))
            })
        }

        var yOffset = chunkSize * currentChunk
        var dataHeight = Math.min(chunkSize, height - yOffset)
        if (flipY) {
            yOffset = height - yOffset - dataHeight
        }

        var outBuffer = new Buffer(width * dataHeight * stride)
        gl.viewport(0, 0, width, height)
        gl.readPixels(0, yOffset, width, dataHeight, format, gl.UNSIGNED_BYTE, outBuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        var rowBuffer = outBuffer
        if (flipY) {
           flipVertically(outBuffer, width, dataHeight, stride)
        }
        currentChunk++
        if (typeof onProgress === 'function') {
            onProgress({
                bounds: [ 0, yOffset, width, dataHeight ],
                current: currentChunk,
                total: totalChunks
            })
        }

        //special process from rgba to rgb
       // var outRGBBuffer = new Buffer(width * dataHeight * 3)
       // rgbaToRgb(outRGBBuffer,outBuffer, width, dataHeight, stride);
        stream.push(outBuffer)
    }
}

function guessStride (gl, format) {
    switch (format) {
        case gl.RGB:
            return 3
        case gl.LUMINANCE_ALPHA:
            return 2
        case gl.ALPHA:
        case gl.LUMINANCE:
            return 1
        default:
            return 4
    }
}

function rgbaToRgb(rgbPixels,pixels, width, height, stride) {
    if(stride == 4)
    {
        var totalNum = width * height * stride;
        var pixelChunkIndex = 0 ;
        for(var pixelIndex = 0; pixelIndex < totalNum; pixelIndex += stride){
            rgbPixels[pixelChunkIndex*3 + 0] = pixels[pixelIndex];
            rgbPixels[pixelChunkIndex*3 + 1] = pixels[pixelIndex+1];
            rgbPixels[pixelChunkIndex*3 + 2] = pixels[pixelIndex+2];

            ++pixelChunkIndex;
        }
    }
}

function flipVertically (pixels, width, height, stride) {
    var rowLength = width * stride
    var temp = Buffer.allocUnsafe(rowLength)
    var halfRows = Math.floor(height / 2)
    for (var rowIndex = 0; rowIndex < halfRows; rowIndex++) {
        var otherRowIndex = height - rowIndex - 1;

        var curRowStart = rowLength * rowIndex;
        var curRowEnd = curRowStart + rowLength;
        var otherRowStart = rowLength * otherRowIndex;
        var otherRowEnd = otherRowStart + rowLength;

        // copy current row into temp
        pixels.copy(temp, 0, curRowStart, curRowEnd)
        // now copy other row into current row
        pixels.copy(pixels, curRowStart, otherRowStart, otherRowEnd)
        // and now copy temp back to other slot
        temp.copy(pixels, otherRowStart, 0, rowLength)
    }
}

/*
function appGet(){
    app.get('/', function(req, res){
        renderer.render(scene, camera, target);

        res.setHeader('Content-Type', 'image/png');
        pngStream(renderer, target).pipe(res);
    });
}
*/
//app.use('/api', router);

app.listen(port);
console.log('Server active on port: ' + port);