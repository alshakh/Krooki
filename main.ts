
/// 
import * as THREE from 'three';
import { MapControls } from './MapControls'
import * as TWEEN from '@tweenjs/tween.js'


function getEventLocation(event: MouseEvent | TouchEvent, dom: HTMLElement) {
  const domOffset = (function () {
    const box = dom.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    };
  })()

  //
  const locationRelativeToPage = (function () {
    const eventAny = <any>event;
    if (eventAny.preventManipulation!) {
      eventAny.preventManipulation();
    }

    var norms = (eventAny.changedTouches || eventAny.targetTouches || eventAny.touches || [eventAny])[0];

    var x = 0, y = 0;
    if (norms.pageX || norms.pageY) {
      x = norms.pageX;
      y = norms.pageY;
    } else if (norms.clientX || norms.clientY) {
      var docEl = document.documentElement;
      x = norms.clientX + document.body.scrollLeft + docEl.scrollLeft;
      y = norms.clientY + document.body.scrollTop + docEl.scrollTop;
    }
    return { x: x, y: y };
  })()

  const locationRelativeToElement = { x: locationRelativeToPage.x - domOffset.left, y: locationRelativeToPage.y - domOffset.top };

  const normalizedLocation = { x: locationRelativeToElement.x / dom.offsetWidth, y: locationRelativeToElement.y / dom.offsetHeight };

  const threeViewportLocation = { x: normalizedLocation.x * 2 - 1, y: - (normalizedLocation.y * 2 - 1) };

  return new THREE.Vector2(threeViewportLocation.x, threeViewportLocation.y);
}










interface KrookiElementDescriptor {
  archetype: string,
  location: { x: number, y: number },
  clickable: boolean,
  message?: string,
  idTag?: string
}
interface krookiDescriptor {
  dimension: { w: number, h: number },
  showGround: boolean,
  elementDescriptors: KrookiElementDescriptor[]
}

abstract class KrookiElement {
  public readonly __descriptor: KrookiElementDescriptor;
  public readonly focusable: boolean;
  protected readonly parentKrooki: Krooki;

  constructor(descriptor: KrookiElementDescriptor, parentKrooki: Krooki) {
    this.__descriptor = descriptor;
    this.focusable = descriptor.clickable;
    this.parentKrooki = parentKrooki;
  }
  protected assignReversePointer(obj: THREE.Object3D): void {
    //assign element so that we can get KrookiElement from object in raycast
    (<any>obj).krookiElement = this;
    if (obj.children.length > 0) {
      obj.children.forEach(this.assignReversePointer.bind(this));
    }
  }

  public abstract getBoundingBox(): THREE.Box3;
  public getCentroid() {
    var t = this.getBoundingBox();
    return new THREE.Vector3(
      (t.max.x + t.min.x) / 2,
      (t.max.y + t.min.y) / 2,
      (t.max.z + t.min.z) / 2);
  }
  public abstract focus(): void;
  public abstract unfocus(): void;
  public abstract getFocusables(): THREE.Object3D[];
}
//
class RandomCube extends KrookiElement {
  private object_3: THREE.Object3D;
  private focusBox: THREE.BoxHelper | null = null;
  private focusCone: THREE.Object3D | null = null;
  private updateFn: ((t: number) => void) | null = null;
  //
  constructor(descriptor: KrookiElementDescriptor, parentKrooki: Krooki) {
    super(descriptor, parentKrooki);
    //
    this.object_3 = (function () {
      var sx = Math.random() + 0.2;
      var sy = Math.random() + 0.2;
      var sz = Math.random() + 0.2;

      var geometry = new THREE.BoxGeometry(sx, sy, sz);
      geometry.translate(0, 0, sz / 2);
      var material = new THREE.MeshPhongMaterial({ color: "#433F81" });
      var cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true; //default is false
      return cube;
    })()
    //
    this.assignReversePointer(this.object_3);
    this.object_3.position.set(descriptor.location.x, descriptor.location.y, 0);
    this.parentKrooki.scene_3.add(this.object_3);
  }
  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.object_3);
  }

  isFocused(): boolean {
    return (this.focusCone !== null);
  }
  focus() {
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
    })(this)

    this.parentKrooki.scene_3.add(this.focusCone);
    //
    var _this = this;
    var qq = this.getBoundingBox().max.z;
    this.updateFn = function (t: number) {
      if (_this.focusCone) {
        _this.focusCone.position.z = qq + 0.3 + 0.3 * Math.sin(t! / 200);
      }
    }
    //
    this.parentKrooki.registerRenderCall(this.updateFn);
  }
  unfocus() {
    this.focusBox && this.parentKrooki.scene_3.remove(this.focusBox);
    this.focusBox = null;
    //
    this.focusCone && this.parentKrooki.scene_3.remove(this.focusCone);
    this.focusCone
    //
    this.updateFn && this.parentKrooki.unregisterRenderCall(this.updateFn);
    this.updateFn = null;
  }
  getFocusables() {
    return [this.object_3];
  }
}
class DoubleCube extends KrookiElement {
  private object_3: THREE.Object3D;
  private focusBox: THREE.BoxHelper | null = null;
  //
  constructor(descriptor: KrookiElementDescriptor, parentKrooki: Krooki) {
    super(descriptor, parentKrooki);
    //
    this.object_3 = (function () {
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.translate(0, 0, 5);
      var material = new THREE.MeshPhongMaterial({ color: "#aaff99" });
      var cube = new THREE.Mesh(geometry, material);
      cube.castShadow = true; //default is false
      cube.position.set(10, 10, 0);
      var g = new THREE.Group();
      g.add(cube);
      var c1 = cube.clone()
      c1.position.z = 2
      c1.translateX(1);
      g.add(c1);
      return g;
    })()
    //
    this.assignReversePointer(this.object_3);
    this.object_3.position.set(descriptor.location.x, descriptor.location.y, 0);
    this.parentKrooki.scene_3.add(this.object_3);
  }
  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.object_3);
  }

  isFocused(): boolean {
    return (this.focusBox !== null);
  }
  focus() {
    this.focusBox && this.unfocus(); // allow multiple calls to focus
    this.focusBox = new THREE.BoxHelper(this.object_3);
    this.parentKrooki.scene_3.add(this.focusBox);
  }

  unfocus() {
    this.focusBox && this.parentKrooki.scene_3.remove(this.focusBox);
    this.focusBox = null;
  }
  getFocusables() {
    return [this.object_3];
  }
}
class FocusControls {
  private readonly camera_3: THREE.Camera;
  private readonly raycaster_3 = new THREE.Raycaster();
  private readonly focusables: THREE.Object3D[];
  private readonly dom: HTMLElement;
  private readonly onFocus: (o: THREE.Object3D) => { centroid: THREE.Vector3, bounding: THREE.Box3 };
  private readonly onComplete: (lookAt: THREE.Vector3) => void;
  private readonly onUpdate: (cameraPos: THREE.Vector3, cameraLookAt: THREE.Vector3) => void;
  private readonly onInterrupt: () => void;
  private tween: TWEEN.Tween | null = null;
  constructor(
    camera: THREE.Camera,
    dom: HTMLElement,
    focusables: THREE.Object3D[],
    onFocus: (o: THREE.Object3D) => { centroid: THREE.Vector3, bounding: THREE.Box3 },
    onUpdate: (cameraPos: THREE.Vector3, cameraLookAt: THREE.Vector3) => void,
    onComplete: (lookAt: THREE.Vector3) => void,
    onInterrupt: () => void,
  ) {
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.onFocus = onFocus;
    this.onInterrupt = onInterrupt;
    this.camera_3 = camera;
    this.focusables = focusables;
    this.dom = dom;
    //

    // TODO :  Click while transetioning 
    (function (_this: FocusControls) {
      var clickDelta: Date;
      _this.dom.addEventListener("mousedown", function (event: MouseEvent) {
        clickDelta = new Date();
      }, false);
      _this.dom.addEventListener("mouseup", function (event: MouseEvent) {
        if (clickDelta && ((new Date()).getTime() - clickDelta.getTime()) < 200) {
          _this.raycaste(getEventLocation(event, _this.dom));
        }
      }, false);
    })(this);


    (function (_this: FocusControls) {
      var tapDelta: Date;
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

  raycaste(loc: THREE.Vector2) {
    this.raycaster_3.setFromCamera(loc, this.camera_3);
    var intersects = this.raycaster_3.intersectObjects(this.focusables, true);
    if (intersects.length > 0) {
      // On Intruption ( Click while doing transition for before click )
      if (this.tween) {
        this.tween = null;
        this.onInterrupt();
      }
      //
      const selectedObject = intersects[0];
      const focusObjectInfo = this.onFocus(selectedObject.object);
      //
      //
      const startCameraPos = this.camera_3.position.clone();
      const endCameraPos = (function () {
        const endCameraPos = focusObjectInfo.centroid.clone();
        endCameraPos.z += (focusObjectInfo.bounding.max.z - focusObjectInfo.bounding.min.z) * 2;
        //
        const cameraFlatDistance = Math.max(focusObjectInfo.bounding.max.x - focusObjectInfo.bounding.min.x, focusObjectInfo.bounding.max.y - focusObjectInfo.bounding.min.y) * 2;
        const objToCameraDirection = new THREE.Vector3().subVectors(startCameraPos, focusObjectInfo.centroid).projectOnPlane(new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(cameraFlatDistance);
        endCameraPos.add(objToCameraDirection);
        return endCameraPos;
      })()
      const startCameraQuat = this.camera_3.quaternion.clone();
      const endCameraQuat = (function (cam) {
        cam.position.copy(endCameraPos);
        cam.lookAt(focusObjectInfo.centroid);
        const ret = cam.quaternion.clone();
        cam.position.copy(startCameraPos);
        cam.quaternion.copy(startCameraQuat);
        return ret;
      })(this.camera_3);
      // Tween 
      const tweenDuration = (function (factor) {
        var d = startCameraPos.distanceTo(endCameraPos) * factor;
        if (d < 500) {
          d = 500;
        }
        return d;
      })(100)
      const _this = this;
      this.tween = new TWEEN.Tween({ x: startCameraPos.x, y: startCameraPos.y, z: startCameraPos.z, t: 0 })
        .to({ x: endCameraPos.x, y: endCameraPos.y, z: endCameraPos.z, t: 1 }, tweenDuration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function (v) {
          _this.camera_3.position.set(v.x, v.y, v.z);
          var qm = new THREE.Quaternion();
          THREE.Quaternion.slerp(startCameraQuat, endCameraQuat, qm, v.t);
          _this.camera_3.quaternion.set(qm.x, qm.y, qm.z, qm.w);
          _this.onUpdate(_this.camera_3.position, focusObjectInfo.centroid);
        })
        .onComplete(function () {
          _this.tween = null;
          _this.onComplete(focusObjectInfo.centroid);
        }).start();
    }
  }

  update(t: number) {
    this.tween && this.tween.update(t);
  }
}
//
class Krooki {
  public readonly __descriptor: krookiDescriptor;
  public readonly scene_3: THREE.Scene;
  private readonly camera_3: THREE.Camera;
  private readonly renderer_3: THREE.Renderer;
  private readonly containerDom: HTMLElement;
  private readonly elements: KrookiElement[];
  //
  private readonly mapControls: any;
  private readonly focusControls: FocusControls;
  //
  private renderCalls: Set<(t: number) => any> = new Set();
  //
  constructor(desc: krookiDescriptor, containerDom: HTMLElement) {
    this.__descriptor = desc;
    this.containerDom = containerDom;
    //
    var _tmp = this.initScene();
    this.camera_3 = _tmp.camera;
    this.scene_3 = _tmp.scene;
    this.renderer_3 = _tmp.renderer;

    // init elements
    var _this = this;
    this.elements = desc.elementDescriptors.map(function (a: KrookiElementDescriptor) { return _this.initElement(a) });
    this.scene_3.add((function (dim: { w: number, h: number }) {
      var geometry = new THREE.PlaneGeometry(dim.w, dim.h);
      var material = new THREE.MeshBasicMaterial({ color: 0x999999 });
      var plane = new THREE.Mesh(geometry, material);
      plane.receiveShadow = true; //default
      return plane;
    })(this.__descriptor.dimension));
    // init map controls
    this.mapControls = new MapControls(this.camera_3, this.renderer_3.domElement);
    this.registerRenderCall(this.mapControls.update);

    // init focus controls
    var _this = this;
    var _tmpRenderCall = function (t: number) { _this.focusControls.update(t) };
    this.focusControls = new FocusControls(
      this.camera_3,
      this.renderer_3.domElement,
      this.elements.map(function (o) { return o.getFocusables() }).reduce(function (b, c) { return b.concat(c) }, []),
      function (o: THREE.Object3D) {
        var ke = <KrookiElement>(<any>o).krookiElement;
        _this.focusOnElement(ke);
        _this.registerRenderCall(_tmpRenderCall);
        return { centroid: ke.getCentroid(), bounding: ke.getBoundingBox() };
      },
      function (pos, lookAt) { },
      function (lookAt) {
        _this.unregisterRenderCall(_tmpRenderCall);
        _this.mapControls.target.x = lookAt.x;
        _this.mapControls.target.y = lookAt.y;
        _this.mapControls.target.z = lookAt.z;
      },
      function () {
        _this.unregisterRenderCall(_tmpRenderCall);
      }
    )
  }
  //
  public registerRenderCall(renderCall: (t: number) => any) {
    this.renderCalls.add(renderCall);
  }
  public unregisterRenderCall(renderCall: (t: number) => any) {
    this.renderCalls.delete(renderCall);
  }

  public renderOnce() {
    this.renderCalls.forEach(function (f) { f(0) });
    this.renderer_3.render(this.scene_3, this.camera_3);
  }
  public renderContinous() {
    requestAnimationFrame(this.renderContinue.bind(this));
  }
  private renderContinue(t: number) {
    //
    this.renderCalls.forEach(function (f) { f(t) });
    this.renderer_3.render(this.scene_3, this.camera_3);
    requestAnimationFrame(this.renderContinue.bind(this));
  }
  //
  private resizeViewport() {
    throw Error('Not implemented');
  }
  //
  private initElement(k: KrookiElementDescriptor): KrookiElement {
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
  }
  //
  private initScene() {
    //
    const SCREEN_WIDTH = window.innerWidth;
    const SCREEN_HEIGHT = window.innerHeight;

    var scene = new THREE.Scene()
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
    light.shadow.camera.near = 0.5;       // default
    light.shadow.camera.far = 100      // default
    light.shadow.camera.left = light.shadow.camera.bottom = -100;
    light.shadow.camera.right = light.shadow.camera.top = 100
    scene.add(new THREE.CameraHelper(light.shadow.camera));


    var axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    return {
      camera: camera,
      scene: scene,
      renderer: renderer,
    }
  }

  private _focusedElement: KrookiElement | null = null;
  focusOnElement(el: KrookiElement) {
    if (this._focusedElement) { this._focusedElement.unfocus() };
    //
    el.focus();
    this._focusedElement = el;
  }
}


///////////////////////////
///////////////////////////
var kDescEx: krookiDescriptor = {
  dimension: { w: 50, h: 50 },
  showGround: true,
  elementDescriptors: [
    {
      archetype: 'DoubleCube',
      location: { x: 10, y: 10 },
      clickable: true,
    }
  ],
}
for (var i = 0; i < 1000; i++) {
  kDescEx.elementDescriptors.push({
    archetype: 'RandomCube',
    location: { x: (Math.random() * 50) - 25, y: (Math.random() * 50) - 25 },
    clickable: true
  })
}

var k = new Krooki(kDescEx, document.body);
k.renderContinous()
