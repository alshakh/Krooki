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
var three_1 = require("three");
function getEventLocation(event, dom) {
    var domOffset = (function () {
        var box = dom.getBoundingClientRect();
        return {
            top: box.top + window.pageYOffset - document.documentElement.clientTop,
            left: box.left + window.pageXOffset - document.documentElement.clientLeft
        };
    })();
    //
    var locationRelativeToPage = (function () {
        var eventAny = event;
        if (eventAny.preventManipulation) {
            eventAny.preventManipulation();
        }
        var norms = (eventAny.changedTouches || eventAny.targetTouches || eventAny.touches || [eventAny])[0];
        var x = 0, y = 0;
        if (norms.pageX || norms.pageY) {
            x = norms.pageX;
            y = norms.pageY;
        }
        else if (norms.clientX || norms.clientY) {
            var docEl = document.documentElement;
            x = norms.clientX + document.body.scrollLeft + docEl.scrollLeft;
            y = norms.clientY + document.body.scrollTop + docEl.scrollTop;
        }
        return { x: x, y: y };
    })();
    var locationRelativeToElement = { x: locationRelativeToPage.x - domOffset.left, y: locationRelativeToPage.y - domOffset.top };
    var normalizedLocation = { x: locationRelativeToElement.x / dom.offsetWidth, y: locationRelativeToElement.y / dom.offsetHeight };
    var threeViewportLocation = { x: normalizedLocation.x * 2 - 1, y: -(normalizedLocation.y * 2 - 1) };
    return new THREE.Vector2(threeViewportLocation.x, threeViewportLocation.y);
}
var KrookiElement = /** @class */ (function () {
    function KrookiElement(descriptor, parentKrooki) {
        this.__descriptor = descriptor;
        this.focusable = descriptor.clickable;
        this.parentKrooki = parentKrooki;
    }
    KrookiElement.prototype.assignReversePointer = function (obj) {
        //assign element so that we can get KrookiElement from object in raycast
        obj.krookiElement = this;
        if (obj.children.length > 0) {
            obj.children.forEach(this.assignReversePointer.bind(this));
        }
    };
    KrookiElement.prototype.getCentroid = function () {
        var t = this.getBoundingBox();
        return new THREE.Vector3((t.max.x + t.min.x) / 2, (t.max.y + t.min.y) / 2, (t.max.z + t.min.z) / 2);
    };
    return KrookiElement;
}());
//
var RandomCube = /** @class */ (function (_super) {
    __extends(RandomCube, _super);
    //
    function RandomCube(descriptor, parentKrooki) {
        var _this_1 = _super.call(this, descriptor, parentKrooki) || this;
        _this_1.focusBox = null;
        _this_1.focusCone = null;
        _this_1.updateFn = null;
        //
        _this_1.object_3 = (function () {
            var sx = Math.random() + 0.2;
            var sy = Math.random() + 0.2;
            var sz = Math.random() + 0.2;
            var geometry = new THREE.BoxGeometry(sx, sy, sz);
            geometry.translate(0, 0, sz / 2);
            var material = new THREE.MeshPhongMaterial({ color: "#433F81" });
            var cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true; //default is false
            cube.receiveShadow = true;
            return cube;
        })();
        //
        _this_1.assignReversePointer(_this_1.object_3);
        _this_1.object_3.position.set(descriptor.location.x, descriptor.location.y, 0);
        _this_1.parentKrooki.scene_3.add(_this_1.object_3);
        return _this_1;
    }
    RandomCube.prototype.getBoundingBox = function () {
        return new THREE.Box3().setFromObject(this.object_3);
    };
    RandomCube.prototype.isFocused = function () {
        return (this.focusCone !== null);
    };
    RandomCube.prototype.focus = function () {
        this.focusBox && this.unfocus(); // allow multiple calls to focus
        //
        this.focusBox = new THREE.BoxHelper(this.object_3);
        this.parentKrooki.scene_3.add(this.focusBox);
        //
        this.focusCone = (function (_this) {
            var g = new THREE.ConeGeometry(0.2, 0.5, 10, 1, false);
            g.rotateX(-Math.PI / 2);
            g.translate(0, 0, 0.5 / 2 + 0.1);
            var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
            m.position.set(_this.__descriptor.location.x, _this.__descriptor.location.y, 0);
            return m;
        })(this);
        this.parentKrooki.scene_3.add(this.focusCone);
        //
        var _this = this;
        var qq = this.getBoundingBox().max.z;
        this.updateFn = function (t) {
            if (_this.focusCone) {
                _this.focusCone.position.z = qq + 0.3 + 0.3 * Math.sin(t / 200);
            }
        };
        //
        this.parentKrooki.registerRenderCall(this.updateFn);
    };
    RandomCube.prototype.unfocus = function () {
        this.focusBox && this.parentKrooki.scene_3.remove(this.focusBox);
        this.focusBox = null;
        //
        this.focusCone && this.parentKrooki.scene_3.remove(this.focusCone);
        this.focusCone;
        //
        this.updateFn && this.parentKrooki.unregisterRenderCall(this.updateFn);
        this.updateFn = null;
    };
    RandomCube.prototype.getFocusables = function () {
        return [this.object_3];
    };
    return RandomCube;
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
            geometry.translate(0, 0, 5);
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
        return (this.focusBox !== null);
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
    function FocusControls(camera, dom, focusables, onFocus, onUpdate, onComplete, onInterrupt) {
        this.raycaster_3 = new THREE.Raycaster();
        this.tween = null;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;
        this.onFocus = onFocus;
        this.onInterrupt = onInterrupt;
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
                    _this.raycaste(getEventLocation(event, _this.dom));
                }
            }, false);
        })(this);
        (function (_this) {
            var tapDelta;
            _this.dom.addEventListener("touchstart", function (event) {
                event.preventDefault();
                tapDelta = new Date();
            }, false);
            _this.dom.addEventListener("touchend", function (event) {
                event.preventDefault();
                if (tapDelta && ((new Date()).getTime() - tapDelta.getTime()) < 200) {
                    _this.raycaste(getEventLocation(event, _this.dom));
                }
                console.log('touchend');
            }, false);
        })(this);
    }
    FocusControls.prototype.raycaste = function (loc) {
        this.raycaster_3.setFromCamera(loc, this.camera_3);
        var intersects = this.raycaster_3.intersectObjects(this.focusables, true);
        if (intersects.length > 0) {
            // On Intruption ( Click while doing transition for before click )
            if (this.tween) {
                this.tween = null;
                this.onInterrupt();
            }
            //
            var selectedObject = intersects[0];
            var focusObjectInfo_1 = this.onFocus(selectedObject.object);
            //
            var startCameraPos_1 = this.camera_3.position.clone();
            var endCameraPos_1 = (function () {
                var endCameraPos = focusObjectInfo_1.centroid.clone();
                endCameraPos.z += (focusObjectInfo_1.bounding.max.z - focusObjectInfo_1.bounding.min.z) * 2;
                //
                var cameraFlatDistance = Math.max(focusObjectInfo_1.bounding.max.x - focusObjectInfo_1.bounding.min.x, focusObjectInfo_1.bounding.max.y - focusObjectInfo_1.bounding.min.y) * 2;
                var objToCameraDirection = new THREE.Vector3().subVectors(startCameraPos_1, focusObjectInfo_1.centroid).projectOnPlane(new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(cameraFlatDistance);
                endCameraPos.add(objToCameraDirection);
                return endCameraPos;
            })();
            var startCameraQuat_1 = this.camera_3.quaternion.clone();
            var endCameraQuat_1 = (function (cam) {
                cam.position.copy(endCameraPos_1);
                cam.lookAt(focusObjectInfo_1.centroid);
                var ret = cam.quaternion.clone();
                cam.position.copy(startCameraPos_1);
                cam.quaternion.copy(startCameraQuat_1);
                return ret;
            })(this.camera_3);
            // Tween 
            var tweenDuration = (function (factor) {
                var d = startCameraPos_1.distanceTo(endCameraPos_1) * factor;
                if (d < 500) {
                    d = 500;
                }
                return d;
            })(100);
            var _this_2 = this;
            this.tween = new TWEEN.Tween({ x: startCameraPos_1.x, y: startCameraPos_1.y, z: startCameraPos_1.z, t: 0 })
                .to({ x: endCameraPos_1.x, y: endCameraPos_1.y, z: endCameraPos_1.z, t: 1 }, tweenDuration)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onUpdate(function (v) {
                _this_2.camera_3.position.set(v.x, v.y, v.z);
                var qm = new THREE.Quaternion();
                THREE.Quaternion.slerp(startCameraQuat_1, endCameraQuat_1, qm, v.t);
                _this_2.camera_3.quaternion.set(qm.x, qm.y, qm.z, qm.w);
                _this_2.onUpdate(_this_2.camera_3.position, focusObjectInfo_1.centroid);
            })
                .onComplete(function () {
                _this_2.tween = null;
                _this_2.onComplete(focusObjectInfo_1.centroid);
            }).start();
        }
    };
    FocusControls.prototype.update = function (t) {
        this.tween && this.tween.update(t);
    };
    return FocusControls;
}());
//
var Krooki = /** @class */ (function () {
    //
    function Krooki(desc) {
        //
        this.renderCalls = new Set();
        this._focusedElement = null;
        this.__descriptor = desc;
        //
        var _tmp = this.initScene(desc);
        this.camera_3 = _tmp.camera;
        this.scene_3 = _tmp.scene;
        this.renderer_3 = _tmp.renderer;
        this.domElement = this.renderer_3.domElement;
        // init elements
        var _this = this;
        this.elements = desc.elementDescriptors.map(function (a) { return _this.initElement(a); });
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
        }, function (pos, lookAt) { }, function (lookAt) {
            _this.unregisterRenderCall(_tmpRenderCall);
            _this.mapControls.target.x = lookAt.x;
            _this.mapControls.target.y = lookAt.y;
            _this.mapControls.target.z = lookAt.z;
        }, function () {
            _this.unregisterRenderCall(_tmpRenderCall);
        });
    }
    //
    Krooki.prototype.registerRenderCall = function (renderCall) {
        this.renderCalls.add(renderCall);
    };
    Krooki.prototype.unregisterRenderCall = function (renderCall) {
        this.renderCalls.delete(renderCall);
    };
    Krooki.prototype.renderOnce = function () {
        this.renderCalls.forEach(function (f) { f(0); });
        this.renderer_3.render(this.scene_3, this.camera_3);
    };
    Krooki.prototype.renderContinous = function () {
        requestAnimationFrame(this.renderContinue.bind(this));
    };
    Krooki.prototype.renderContinue = function (t) {
        //
        this.renderCalls.forEach(function (f) { f(t); });
        this.renderer_3.render(this.scene_3, this.camera_3);
        requestAnimationFrame(this.renderContinue.bind(this));
    };
    //
    Krooki.prototype.resizeViewport = function () {
        throw Error('Not implemented');
    };
    //
    Krooki.prototype.initElement = function (k) {
        // TODO : reduce coupling with specific implementations of KrookiElement  
        switch (k.archetype) {
            case "RandomCube":
                return new RandomCube(k, this);
            case "DoubleCube":
                return new DoubleCube(k, this);
            //
            //
            default:
                throw "can't find archetypeName '" + k.archetype + "'";
        }
    };
    //
    Krooki.prototype.initScene = function (desc) {
        //
        var screenWidth = (desc.viewport === 'FULL') ? window.innerWidth : desc.viewport.w;
        var screenHeight = (desc.viewport === 'FULL') ? window.innerHeight : desc.viewport.h;
        var lightVector = (new THREE.Vector3(desc.light.vector.x, desc.light.vector.y, desc.light.vector.z)).normalize();
        var sceneDim = { w: desc.dimension.w, h: desc.dimension.h };
        //
        var scene = new THREE.Scene();
        var camera = (function () {
            var c = new THREE.PerspectiveCamera(75, screenWidth / screenHeight, 0.1, 1000);
            c.position.z = 10;
            c.position.y = 10;
            c.up.set(0, 0, 1);
            c.lookAt(0, 0, 0);
            return c;
        })();
        var renderer = (function () {
            var r = new THREE.WebGLRenderer({ antialias: true });
            r.setClearColor("#cccccc");
            r.setSize(screenWidth, screenHeight);
            r.shadowMap.enabled = true;
            r.shadowMap.type = THREE.PCFSoftShadowMap;
            return r;
        })();
        var light = (function () {
            var l = new THREE.DirectionalLight(0xffffff);
            l.castShadow = true;
            // set shadowMapSize relative to di
            var shadowMapSize = Math.min(Math.pow(2, Math.ceil(Math.log(Math.max(sceneDim.w, sceneDim.h) * 50) / Math.log(2))), 8192);
            l.shadow.mapSize.width = shadowMapSize;
            l.shadow.mapSize.height = shadowMapSize;
            // set up camera based on dimension
            /// //// INACCURATE TODO TODO TODO TODO
            var diag = (new THREE.Vector2(sceneDim.w / 2, sceneDim.h / 2)).length();
            var lightPos = lightVector.clone().multiplyScalar(diag * lightVector.clone().projectOnPlane(new three_1.Vector3(0, 0, 1)).length()).add(new THREE.Vector3(10, 10, 10));
            var lightDepth = lightPos.length() * 2;
            var lightSide = diag * lightVector.clone().z;
            //
            l.position.add(lightPos);
            l.shadow.camera.near = 0.5;
            l.shadow.camera.far = lightDepth;
            l.shadow.camera.left = l.shadow.camera.bottom = -lightSide;
            l.shadow.camera.right = l.shadow.camera.top = lightSide;
            return l;
        })();
        scene.add(light);
        var ambientlight = new THREE.AmbientLight(0x222222); // soft white light
        if (desc.showGround) {
            scene.add((function (dim) {
                var geometry = new THREE.PlaneGeometry(dim.w, dim.h);
                var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
                var plane = new THREE.Mesh(geometry, material);
                plane.receiveShadow = true; //default
                return plane;
            })(sceneDim));
        }
        scene.add(new THREE.CameraHelper(light.shadow.camera));
        scene.add(ambientlight);
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
var kDescEx = {
    dimension: { w: 50, h: 50 },
    light: {
        vector: { x: 1, y: 2, z: 6 },
    },
    viewport: "FULL",
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
        archetype: 'RandomCube',
        location: { x: (Math.random() * 50) - 25, y: (Math.random() * 50) - 25 },
        clickable: true
    });
}
var k = new Krooki(kDescEx);
document.body.appendChild(k.domElement);
k.renderContinous();
