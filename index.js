global.THREE = require("./libs/three.js");

// Create a DOM
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();
global.document = MockBrowser.createDocument();
global.window = MockBrowser.createWindow();
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var schedule = require("node-schedule");

require("./libs/CanvasRenderer.js");
require("./libs/Projector.js");
require("./libs/inflate.min.js");
require("./libs/FBXLoader.js");
require("./libs/controls/OrbitControls.js");
require("./libs/Detector.js");
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

init();
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
    var loader = new THREE.FBXLoader();

    loader.load( 'resources/models/NA.fbx', function( object ) {
        scene.add( object );

    });

    renderer = new THREE.WebGLRenderer({context:gl});
    renderer.setSize(width, height);
    renderer.setClearColor(0x11aabb, 1);
    renderer.shadowMap.enabled = true;

    target = new THREE.WebGLRenderTarget(width, height);
}

app.get('/', function(req, res){
    response = res;
    var rule1     = new schedule.RecurrenceRule();
    var times1    = [1,2,3,4,5,6,7,8,9,10,11,12];
    rule1.second  = times1;
    schedule.scheduleJob(rule1, function(){
        animate();
    });

//    renderer.render(scene, camera, target);

//    res.setHeader('Content-Type', 'image/png');
 //   pngStream(renderer, target).pipe(res);
});


function animate() {

    //requestAnimationFrame( animate );

    if ( mixers.length > 0 ) {

        for ( var i = 0; i < mixers.length; i ++ ) {

            mixers[ i ].update( clock.getDelta() );
        }
    }
    renderer.render( scene, camera, target );

//    response.setHeader('Content-Type', 'image/png');
//    pngStream(renderer, target).pipe(response);
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