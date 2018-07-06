"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/// 
var THREE = __importStar(require("three"));
var MapControls_1 = require("./MapControls");
//
var prepareScene = function (container) {
    //
    var SCREEN_WIDTH = window.innerWidth;
    var SCREEN_HEIGHT = window.innerHeight;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, SCREEN_WIDTH / SCREEN_HEIGHT, 0.1, 1000);
    camera.position.z = 10;
    camera.position.y = 10;
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);
    renderer.setClearColor("#cccccc");
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(3, 10, 7);
    light.castShadow = true;
    scene.add(light);
    var ambientlight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientlight);
    //Set up shadow properties for the light
    light.shadow.mapSize.width = 1024; // default
    light.shadow.mapSize.height = 1024; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 100; // default
    var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    return {
        camera: camera,
        scene: scene,
        renderer: renderer,
        render: function () { renderer.render(scene, camera); },
    };
};
var archetypeFactory = function (archetypeName) {
    switch (archetypeName) {
        case "SimpleCube":
            return (function () {
                var geometry = new THREE.BoxGeometry(1, 1, 1);
                var material = new THREE.MeshPhongMaterial({ color: "#433F81" });
                var cube = new THREE.Mesh(geometry, material);
                cube.castShadow = true; //default is false
                return { material: material, object: cube };
            })();
        //
        default:
            throw "can't find archetypeName '" + archetypeName + "'";
    }
};
var initKrookiElement = function (elDesc) {
    var archetypeInstance = archetypeFactory(elDesc.archetype);
    archetypeInstance.object.position.x = elDesc.location.x;
    archetypeInstance.object.position.y = elDesc.location.y;
    return {
        __descriptor: elDesc,
        object_3: archetypeInstance.object,
        material_3: archetypeInstance.material,
    };
};
var initKrooki = function (desc) {
    var sceneInfo = prepareScene(document.body);
    var elements = desc.elementDescriptors.map(initKrookiElement);
    elements.forEach(function (o) { sceneInfo.scene.add(o.object_3); });
    // ground 
    var ground = createGround(desc.dimension);
    if (desc.showGround) {
        sceneInfo.scene.add(ground);
    }
    //
    return {
        __descriptor: desc,
        scene_3: sceneInfo.scene,
        renderer_3: sceneInfo.renderer,
        camera_3: sceneInfo.camera,
        render: sceneInfo.render,
        elements: elements,
    };
};
var createGround = function (dim) {
    var geometry = new THREE.PlaneGeometry(dim.w, dim.h);
    var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var plane = new THREE.Mesh(geometry, material);
    plane.receiveShadow = true; //default
    return plane;
};
var kDescEx = {
    dimension: { w: 100, h: 100 },
    showGround: true,
    elementDescriptors: [],
};
for (var i = 0; i < 1000; i++) {
    kDescEx.elementDescriptors.push({
        archetype: 'SimpleCube',
        location: { x: (Math.random() * 100) - 50, y: (Math.random() * 100) - 50 },
        clickable: true
    });
}
var krooki = initKrooki(kDescEx);
var controls = new MapControls_1.MapControls(krooki.camera_3, krooki.renderer_3.domElement);
//////////
var raycaster = new THREE.Raycaster();
var raycaste = function (loc) {
    raycaster.setFromCamera(loc, krooki.camera_3);
    var intersects = raycaster.intersectObjects(krooki.elements.map(function (el) { return el.object_3; }), true); //array
    if (intersects.length > 0) {
        var selectedObject = intersects[0];
        selectedObject.object.material.color.setHex(Math.random() * 0xffffff);
        //selectedObject.object.position.x += 0.2;
    }
};
var clickDelta;
krooki.renderer_3.domElement.addEventListener("mousedown", function (event) {
    clickDelta = new Date();
}, false);
krooki.renderer_3.domElement.addEventListener("mouseup", function (event) {
    if (clickDelta && ((new Date()).getTime() - clickDelta.getTime()) < 200) {
        var mouse = new THREE.Vector2();
        mouse.x = (event.clientX / krooki.renderer_3.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / krooki.renderer_3.domElement.clientHeight) * 2 + 1;
        raycaste(mouse);
    }
}, false);
var tapDelta;
krooki.renderer_3.domElement.addEventListener("touchstart", function (event) {
    tapDelta = new Date();
}, false);
krooki.renderer_3.domElement.addEventListener("touchend", function (event) {
    alert("touched " + ((new Date()).getTime() - tapDelta.getTime()));
    if (tapDelta && ((new Date()).getTime() - tapDelta.getTime()) < 200) {
        var touch = new THREE.Vector2();
        touch.x = (event.touches[0].clientX / krooki.renderer_3.domElement.clientWidth) * 2 - 1;
        touch.y = -(event.touches[0].clientY / krooki.renderer_3.domElement.clientHeight) * 2 + 1;
        raycaste(touch);
    }
}, false);
var render = function () {
    requestAnimationFrame(render);
    controls.update();
    krooki.render();
};
render();
// var cube = createCube()
// scene.add(createGround());
// scene.add(cube);
// // Render Loop
// var t = 0;
// var r = 3;
// var render = function () {
//   requestAnimationFrame(render);
//   t += 0.01;
//   cube.rotation.x += 0.01;
//   cube.rotation.y += 0.02;
//   cube.position.z += 0.1* Math.sin(t);
//   //
//   camera.position.x = r * Math.sin(t);
//   camera.position.y = r * Math.cos(t);
//   camera.lookAt(0,0,0)
//   renderer.render(scene, camera);
//   t = t % (2 * 3.14) ;
// };
// render();
