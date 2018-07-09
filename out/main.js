"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var TWEEN = __importStar(require("@tweenjs/tween.js"));
var KrookiElement = /** @class */ (function () {
    function KrookiElement(descriptor, parentKrooki) {
        this.__descriptor = descriptor;
        this.focusable = descriptor.clickable;
        this.parentKrooki = parentKrooki;
    }
    KrookiElement.prototype.assignReversePointer = function (obj) {
        //assign element so that we can get KrookiElement from object in raycast
        var _this = this;
        obj.krookiElement = _this;
        if (obj.children.length > 0) {
            obj.children.forEach(function (f) { _this.assignReversePointer(f); });
        }
    };
    KrookiElement.prototype.getCentroid = function () {
        var t = this.getBoundingBox();
        return new THREE.Vector3((t.max.x + t.min.x) / 2, (t.max.y + t.min.y) / 2, (t.max.z + t.min.z) / 2);
    };
    return KrookiElement;
}());
//
var SimpleCube = /** @class */ (function (_super) {
    __extends(SimpleCube, _super);
    //
    function SimpleCube(descriptor, parentKrooki) {
        var _this_1 = _super.call(this, descriptor, parentKrooki) || this;
        _this_1.focusBox = null;
        //
        _this_1.object_3 = (function () {
            var geometry = new THREE.BoxGeometry(1, 1, 1);
            geometry.translate(0, 0, 0.5);
            var material = new THREE.MeshPhongMaterial({ color: "#433F81" });
            var cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true; //default is false
            return cube;
        })();
        //
        _this_1.assignReversePointer(_this_1.object_3);
        _this_1.object_3.position.set(descriptor.location.x, descriptor.location.y, 0);
        _this_1.parentKrooki.scene_3.add(_this_1.object_3);
        return _this_1;
    }
    SimpleCube.prototype.getBoundingBox = function () {
        return new THREE.Box3().setFromObject(this.object_3);
    };
    SimpleCube.prototype.isFocused = function () {
        return (this.focus !== null);
    };
    SimpleCube.prototype.focus = function () {
        this.focusBox && this.unfocus(); // allow multiple calls to focus
        this.focusBox = new THREE.BoxHelper(this.object_3);
        this.parentKrooki.scene_3.add(this.focusBox);
    };
    SimpleCube.prototype.unfocus = function () {
        this.focusBox && this.parentKrooki.scene_3.remove(this.focusBox);
        this.focusBox = null;
    };
    SimpleCube.prototype.getFocusables = function () {
        return [this.object_3];
    };
    return SimpleCube;
}(KrookiElement));
var DoubleCube = /** @class */ (function (_super) {
    __extends(DoubleCube, _super);
    //
    function DoubleCube(descriptor, parentKrooki) {
        var _this_1 = _super.call(this, descriptor, parentKrooki) || this;
        _this_1.focusBox = null;
        //
        _this_1.object_3 = (function () {
            var geometry = new THREE.BoxGeometry(1, 1, 1);
            geometry.translate(0, 0, 0.5);
            var material = new THREE.MeshPhongMaterial({ color: "#aaff99" });
            var cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true; //default is false
            cube.position.set(10, 10, 0);
            var g = new THREE.Group();
            g.add(cube);
            var c1 = cube.clone();
            c1.position.z = 2;
            c1.translateX(1);
            g.add(c1);
            return g;
        })();
        //
        _this_1.assignReversePointer(_this_1.object_3);
        _this_1.object_3.position.set(descriptor.location.x, descriptor.location.y, 0);
        _this_1.parentKrooki.scene_3.add(_this_1.object_3);
        return _this_1;
    }
    DoubleCube.prototype.getBoundingBox = function () {
        return new THREE.Box3().setFromObject(this.object_3);
    };
    DoubleCube.prototype.isFocused = function () {
        return (this.focus !== null);
    };
    DoubleCube.prototype.focus = function () {
        this.focusBox && this.unfocus(); // allow multiple calls to focus
        this.focusBox = new THREE.BoxHelper(this.object_3);
        this.parentKrooki.scene_3.add(this.focusBox);
    };
    DoubleCube.prototype.unfocus = function () {
        this.focusBox && this.parentKrooki.scene_3.remove(this.focusBox);
        this.focusBox = null;
    };
    DoubleCube.prototype.getFocusables = function () {
        return [this.object_3];
    };
    return DoubleCube;
}(KrookiElement));
var FocusControls = /** @class */ (function () {
    function FocusControls(camera, dom, focusables, onFocus, onUpdate, onComplete) {
        this.raycaster_3 = new THREE.Raycaster();
        this.tween = null;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
        this.onFocus = onFocus;
        this.camera_3 = camera;
        this.focusables = focusables;
        this.dom = dom;
        //
        // TODO :  Click while transetioning 
        (function (_this) {
            var clickDelta;
            _this.dom.addEventListener("mousedown", function (event) {
                clickDelta = new Date();
            }, false);
            _this.dom.addEventListener("mouseup", function (event) {
                if (clickDelta && ((new Date()).getTime() - clickDelta.getTime()) < 200) {
                    var mouse = new THREE.Vector2();
                    mouse.x = (event.clientX / _this.dom.clientWidth) * 2 - 1;
                    mouse.y = -(event.clientY / _this.dom.clientHeight) * 2 + 1;
                    _this.raycaste(mouse);
                }
            }, false);
        })(this);
        // var tapDelta: Date;
        // krooki.renderer_3.domElement.addEventListener("touchstart", function (event) {
        //   tapDelta = new Date();
        // }, false);
        // krooki.renderer_3.domElement.addEventListener("touchend", function (event) {
        //   if (tapDelta && ((new Date()).getTime() - tapDelta.getTime()) < 200) {
        //     var touch = new THREE.Vector2();
        //     touch.x = (event.touches[0].clientX / krooki.renderer_3.domElement.clientWidth) * 2 - 1;
        //     touch.y = - (event.touches[0].clientY / krooki.renderer_3.domElement.clientHeight) * 2 + 1;
        //     raycaste(touch);
        //   }
        // }, false);
    }
    FocusControls.prototype.raycaste = function (loc) {
        this.raycaster_3.setFromCamera(loc, this.camera_3);
        var intersects = this.raycaster_3.intersectObjects(this.focusables, true);
        if (intersects.length > 0) {
            var selectedObject = intersects[0];
            var focuseOn = this.onFocus(selectedObject.object);
            var cameraCircle = {
                center: new THREE.Vector3(focuseOn.centroid.x, focuseOn.centroid.y, focuseOn.centroid.z + (focuseOn.bounding.max.z - focuseOn.bounding.min.z) * 2),
                radius: Math.max(focuseOn.bounding.max.x - focuseOn.bounding.min.x, focuseOn.bounding.max.y - focuseOn.bounding.min.y) * 2,
                focusCenter: focuseOn.centroid,
            };
            //smoothables = {dir : }
            var _this = this;
            this.tween && this.tween.stop();
            this.tween = new TWEEN.Tween(this.camera_3.position.clone());
            this.tween.to({
                x: cameraCircle.center.x + cameraCircle.radius,
                y: cameraCircle.center.y,
                z: cameraCircle.center.z
            }, 3000).easing(TWEEN.Easing.Quadratic.In).onUpdate(function (obj) {
                _this.camera_3.position.set(obj.x, obj.y, obj.z);
                _this.camera_3.lookAt(cameraCircle.focusCenter);
                _this.onUpdate(_this.camera_3.position, cameraCircle.center);
                // mapControls.target = cameraCircle.focusCenter;
                console.log('onUpdate Called');
            }).onComplete(function () { console.log('completed'); _this.tween = null; _this.onComplete(); }).start();
        }
    };
    FocusControls.prototype.update = function (t) {
        t && this.tween && this.tween.update(t);
    };
    return FocusControls;
}());
//
var Krooki = /** @class */ (function () {
    //
    function Krooki(desc, containerDom) {
        //
        this.renderCalls = [];
        this._focusedElement = null;
        this.__descriptor = desc;
        this.containerDom = containerDom;
        //
        var _tmp = this.initScene();
        this.camera_3 = _tmp.camera;
        this.scene_3 = _tmp.scene;
        this.renderer_3 = _tmp.renderer;
        // init elements
        var _this = this;
        this.elements = desc.elementDescriptors.map(function (a) { return _this.initElement(a); });
        this.scene_3.add((function (dim) {
            var geometry = new THREE.PlaneGeometry(dim.w, dim.h);
            var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
            var plane = new THREE.Mesh(geometry, material);
            plane.receiveShadow = true; //default
            return plane;
        })(this.__descriptor.dimension));
        // init map controls
        this.mapControls = new MapControls_1.MapControls(this.camera_3, this.renderer_3.domElement);
        this.registerRenderCall(this.mapControls.update);
        // init focus controls
        var _this = this;
        var _tmpRenderCall = function (t) { _this.focusControls.update(t); };
        this.focusControls = new FocusControls(this.camera_3, this.renderer_3.domElement, this.elements.map(function (o) { return o.getFocusables(); }).reduce(function (b, c) { return b.concat(c); }, []), function (o) {
            var ke = o.krookiElement;
            _this.focusOnElement(ke);
            _this.registerRenderCall(_tmpRenderCall);
            return { centroid: ke.getCentroid(), bounding: ke.getBoundingBox() };
        }, function (pos, lookAt) {
            _this.mapControls.target = lookAt; // TODO
        }, function () {
            _this.unregisterRenderCall(_tmpRenderCall);
        });
    }
    //
    Krooki.prototype.registerRenderCall = function (renderCall) {
        this.renderCalls.push(renderCall);
        console.log('register', this.renderCalls);
    };
    Krooki.prototype.unregisterRenderCall = function (renderCall) {
        var index = this.renderCalls.indexOf(renderCall);
        if (index !== -1) {
            this.renderCalls.splice(index, 1);
        }
        console.log('unregister', this.renderCalls);
    };
    Krooki.prototype.renderOnce = function () {
        this.renderCalls.forEach(function (f) { f(0); });
        this.renderer_3.render(this.scene_3, this.camera_3);
    };
    Krooki.prototype.renderContinue = function (t) {
        var _this = this;
        //
        if (t) {
            this.renderCalls.forEach(function (f) { f(t); });
            this.renderer_3.render(this.scene_3, this.camera_3);
        }
        requestAnimationFrame(function (t) { _this.renderContinue(t); });
    };
    //
    Krooki.prototype.resizeViewport = function () {
        throw Error('Not implemented');
    };
    //
    Krooki.prototype.initElement = function (k) {
        // TODO : reduce coupling with specific implementations of KrookiElement  
        switch (k.archetype) {
            case "SimpleCube":
                return new SimpleCube(k, this);
            case "DoubleCube":
                return new DoubleCube(k, this);
            //
            //
            default:
                throw "can't find archetypeName '" + k.archetype + "'";
        }
    };
    //
    Krooki.prototype.initScene = function () {
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
        this.containerDom.appendChild(renderer.domElement);
        renderer.setClearColor("#cccccc");
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(3, 2, 10).multiplyScalar(4);
        light.castShadow = true;
        scene.add(light);
        var ambientlight = new THREE.AmbientLight(0x222222); // soft white light
        scene.add(ambientlight);
        //Set up shadow properties for the light
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 100; // default
        light.shadow.camera.left = light.shadow.camera.bottom = -100;
        light.shadow.camera.right = light.shadow.camera.top = 100;
        scene.add(new THREE.CameraHelper(light.shadow.camera));
        var axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);
        return {
            camera: camera,
            scene: scene,
            renderer: renderer,
        };
    };
    Krooki.prototype.focusOnElement = function (el) {
        if (this._focusedElement) {
            this._focusedElement.unfocus();
        }
        ;
        //
        el.focus();
        this._focusedElement = el;
    };
    return Krooki;
}());
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
var kDescEx = {
    dimension: { w: 100, h: 100 },
    showGround: true,
    elementDescriptors: [
        {
            archetype: 'DoubleCube',
            location: { x: 10, y: 10 },
            clickable: true,
        }
    ],
};
for (var i = 0; i < 1000; i++) {
    kDescEx.elementDescriptors.push({
        archetype: 'SimpleCube',
        location: { x: (Math.random() * 100) - 50, y: (Math.random() * 100) - 50 },
        clickable: true
    });
}
var k = new Krooki(kDescEx, document.body);
k.renderContinue();
// k.renderOnce()
//
// const initKrooki = function (desc: krookiDescriptor, domEl: HTMLElement) {
//   var sceneInfo = prepareScene(domEl);
//   var elements = desc.elementDescriptors.map(initKrookiElement);
//   elements.forEach(function (o) { sceneInfo.scene.add(o.object_3) });
//   //
//   var mapControls = new MapControls(sceneInfo.camera, sceneInfo.renderer.domElement);
//   // ground 
//   var ground = createGround(desc.dimension);
//   if (desc.showGround) {
//     sceneInfo.scene.add(ground)
//   }
//   // render function
//   var tweenObj: TWEEN.Tween | null = null;
//   var renderfn = function (t) {
//     mapControls.update();
//     sceneInfo.render();
//     if (tweenObj) {
//       tweenObj.update(t);
//     }
//   }
//   //
//   return {
//     __descriptor: desc,
//     scene_3: sceneInfo.scene,
//     renderer_3: sceneInfo.renderer,
//     camera_3: sceneInfo.camera,
//     render: renderfn,
//     elements: elements,
//     mapControls: mapControls,
//     focusOnElement: focusOnElementFn
//   }
// }
// var createGround = function (dim: { w: number, h: number }) {
//   var geometry = new THREE.PlaneGeometry(dim.w, dim.h);
//   var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
//   var plane = new THREE.Mesh(geometry, material);
//   plane.receiveShadow = true; //default
//   return plane;
// }
// var krooki = initKrooki(kDescEx, document.body);
// //////////
// var raycaster = new THREE.Raycaster();
// var raycaste = function (loc: THREE.Vector2) {
//   raycaster.setFromCamera(loc, krooki.camera_3);
//   var intersects = raycaster.intersectObjects(krooki.elements.map(function (el) { return el.object_3 }), true); //array
//   if (intersects.length > 0) {
//     var selectedObject = intersects[0];
//     //(<THREE.MeshPhongMaterial>(<THREE.Mesh>selectedObject.object).material).color.setHex(Math.random() * 0xffffff);
//     krooki.focusOnElement(<KrookiElement>(<any>selectedObject.object).krookiElement);
//     //selectedObject.object.position.x += 0.2;
//   }
// }
// var clickDelta: Date;
// krooki.renderer_3.domElement.addEventListener("mousedown", function (event) {
//   clickDelta = new Date();
// }, false);
// krooki.renderer_3.domElement.addEventListener("mouseup", function (event) {
//   if (clickDelta && ((new Date()).getTime() - clickDelta.getTime()) < 200) {
//     var mouse = new THREE.Vector2();
//     mouse.x = (event.clientX / krooki.renderer_3.domElement.clientWidth) * 2 - 1;
//     mouse.y = - (event.clientY / krooki.renderer_3.domElement.clientHeight) * 2 + 1;
//     raycaste(mouse);
//   }
// }, false);
// var tapDelta: Date;
// krooki.renderer_3.domElement.addEventListener("touchstart", function (event) {
//   tapDelta = new Date();
// }, false);
// krooki.renderer_3.domElement.addEventListener("touchend", function (event) {
//   if (tapDelta && ((new Date()).getTime() - tapDelta.getTime()) < 200) {
//     var touch = new THREE.Vector2();
//     touch.x = (event.touches[0].clientX / krooki.renderer_3.domElement.clientWidth) * 2 - 1;
//     touch.y = - (event.touches[0].clientY / krooki.renderer_3.domElement.clientHeight) * 2 + 1;
//     raycaste(touch);
//   }
// }, false);
// //s.children.filter()
// var render = function (t) {
//   requestAnimationFrame(render);
//   krooki.render(t);
// };
// requestAnimationFrame(render);
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
