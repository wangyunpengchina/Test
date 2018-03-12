global.THREE = require("./libs/three.js");

// Create a DOM
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();
global.document = MockBrowser.createDocument();
global.window = MockBrowser.createWindow();
global.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;

global.Zlib = require("zlib-sync");
//global.Zlib = require('./libs/node-zlib.js');
//Zlib.Inflate = require("./libs/inflate.min.js");
//global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//require('three-fbx-loader')(THREE)

//require("./libs/inflate.min.js");
require("./libs/Detector.js");
require("./libs/FBXLoader.js");
require("./libs/CanvasRenderer.js");
require("./libs/Projector.js");
require("./libs/controls/OrbitControls.js");
var Stats = require("./libs/stats.min.js");

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

var response, camera, scene, renderer, target;

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
    var loader = new THREE.FBXLoader();

    loader.load('/resources/models/NA_binary.fbx', function (geometry) {
        var material = new THREE.MeshNormalMaterial();
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh)
    })

    renderer = new THREE.WebGLRenderer({context:gl});
    renderer.setSize(width, height);
    renderer.setClearColor(0x11aabb, 1);
    renderer.shadowMap.enabled = true;

    target = new THREE.WebGLRenderTarget(width, height);

}

app.get('/', function(req, res){
    response = res;

    init();
    setInterval(animate,33,"Interval");
//    renderer.render(scene, camera, target);

//    res.setHeader('Content-Type', 'image/png');
 //   pngStream(renderer, target).pipe(res);
});


function animate() {

    if ( mixers.length > 0 ) {

        for ( var i = 0; i < mixers.length; i ++ ) {

            mixers[ i ].update( clock.getDelta() );
        }
    }

    renderer.render( scene, camera, target );

   // response.setHeader('Content-Type', 'image/png');
   // pngStream(renderer, target).pipe(response);
   // response.end();
    //  stats.update();
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