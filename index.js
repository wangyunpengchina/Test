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
//const { Canvas } = require("canvas");
require("./libs/Projector.js");
require("./libs/controls/OrbitControls.js");
var Stats = require("./libs/stats.min.js");
var fs = require("fs");

//REST API
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var router = express.Router();


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
    _canvas = new Canvas(width, height);
    renderer = new THREE.CanvasRenderer({
        canvas: _canvas
    });
    */
    renderer = new THREE.WebGLRenderer({context:gl});
    renderer.setSize(width, height,false);
    renderer.setClearColor(0xaaaabb, 1);
    renderer.shadowMap.enabled = true;

    target = new THREE.WebGLRenderTarget(width, height);

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
    myCameraTween(camera,360,1,3);

 //   response.setHeader('Content-Type', 'image/png');
    renderer.render(scene, camera, target);

    // now you can write it to a new PNG file
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


    var stream = pngStream(renderer, target);
    stream.pipe(output);


//    response.setHeader('Content-Type', 'image/png');
//    pngStream(renderer, target).pipe(response);
  //  response.end();

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