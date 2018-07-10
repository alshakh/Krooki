
/// 
import * as THREE from 'three';
import { MapControls } from './MapControls'
import * as TWEEN from '@tweenjs/tween.js'
//threeControls.
// interface KrookiElement {
//   object_3: THREE.Object3D,
//   material_3: THREE.Material,
//   : KrookiElementDescriptor,
// }


// var archetypeFactory = function (archetypeName: string): { material: THREE.Material, object: THREE.Object3D } {
//   switch (archetypeName) {
//     case "SimpleCube":
//       return (function () {
//         var geometry = new THREE.BoxGeometry(1, 1, 1);
//         geometry.translate(0, 0, 0.5);
//         var material = new THREE.MeshPhongMaterial({ color: "#433F81" });
//         var cube = new THREE.Mesh(geometry, material);
//         cube.castShadow = true; //default is false
//         return { material: material, object: cube };
//       })()
//     //
//     case "TestGroup":
//       return (function () {
//         var geometry = new THREE.BoxGeometry(1, 1, 1);
//         geometry.translate(0, 0, 0.5);
//         var material = new THREE.MeshPhongMaterial({ color: "#aaff99" });
//         var cube = new THREE.Mesh(geometry, material);
//         cube.castShadow = true; //default is false
//         cube.position.set(2, 2, 2)
//         var g = new THREE.Group();
//         g.add(cube);
//         var c1 = cube.clone()
//         c1.position.set(-2, -1, 1);
//         g.add(c1);
//         return { material: material, object: g };
//       })()
//     default:
//       throw "can't find archetypeName '" + archetypeName + "'";
//   }
// }



// const initKrookiElement = function (elDesc: KrookiElementDescriptor): KrookiElement {
//   var archetypeInstance = archetypeFactory(elDesc.archetype)
//   archetypeInstance.object.position.x = elDesc.location.x;
//   archetypeInstance.object.position.y = elDesc.location.y;

//   var tmpKrookiElement = {
//     __descriptor: elDesc,
//     object_3: archetypeInstance.object,
//     material_3: archetypeInstance.material,
//   };

//   // assign element so that we can get KrookiElement from object in raycast
//   if (elDesc.clickable) {
//     var assignElement = function assignElement(obj: THREE.Object3D) {
//       (<any>obj).krookiElement = tmpKrookiElement;
//       if (obj.children.length > 0) {
//         obj.children.forEach(assignElement);
//       }
//     }
//     assignElement(tmpKrookiElement.object_3)
//   }
//   return tmpKrookiElement;
// }

function getEventLocation(event : TouchEvent | MouseEvent, dom:HTMLElement) : THREE.Vector2 {
  var loc = new THREE.Vector2();
  if (event instanceof MouseEvent) { 
    loc.x = (event.clientX / dom.clientWidth) * 2 - 1;
    loc.y = - (event.clientY / dom.clientHeight) * 2 + 1;
  
  } else {

  }
  console.log(loc);
  return loc;
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
      obj.children.forEach( this.assignReversePointer.bind(this));
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
class SimpleCube extends KrookiElement {
  private object_3: THREE.Object3D;
  private focusBox: THREE.BoxHelper | null = null;
  private focusCone : THREE.Object3D | null = null;
  private updateFn : ((t? : number) => void ) | null = null;
  //
  constructor(descriptor: KrookiElementDescriptor, parentKrooki: Krooki) {
    super(descriptor, parentKrooki);
    //
    this.object_3 = (function () {
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      geometry.translate(0, 0, 0.5);
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
      return new THREE.Mesh(new THREE.ConeGeometry(0.5,2,5,1,false),new THREE.MeshLambertMaterial({color:0xff0000}));
    })(this)
    this.parentKrooki.scene_3.add(this.focusCone);
    //
    var _this = this;
    this.updateFn = function(t? : number) {
      _this.focusCone && _this.focusCone.translateZ(2 * Math.sin(t!) );
    }
    //
    this.parentKrooki.registerRenderCall (this.updateFn);
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
    return (this.focus !== null);
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
          _this.raycaste(getEventLocation(event,_this.dom));
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
      var selectedObject = intersects[0];
      var focuseOn = this.onFocus(selectedObject.object);

      var cameraCircle: { focusCenter: THREE.Vector3, center: THREE.Vector3, radius: number } = {
        center: new THREE.Vector3(focuseOn.centroid.x, focuseOn.centroid.y, focuseOn.centroid.z + (focuseOn.bounding.max.z - focuseOn.bounding.min.z) * 2),
        radius: Math.max(focuseOn.bounding.max.x - focuseOn.bounding.min.x, focuseOn.bounding.max.y - focuseOn.bounding.min.y) * 2,
        focusCenter: focuseOn.centroid,
      }
      var startPosition = new THREE.Vector3().copy(this.camera_3.position);
      var endPosition = new THREE.Vector3(cameraCircle.center.x + cameraCircle.radius, cameraCircle.center.y, cameraCircle.center.z);
      var startRotation = new THREE.Quaternion().copy(this.camera_3.quaternion);
      this.camera_3.position.copy(endPosition);
      this.camera_3.lookAt(cameraCircle.focusCenter);
      var endRotation = new THREE.Quaternion().copy(this.camera_3.quaternion);
      this.camera_3.position.copy(startPosition);
      this.camera_3.quaternion.copy(startRotation);
      //
      var startValues = {
        px: startPosition.x,
        py: startPosition.y,
        pz: startPosition.z,
        rx: startRotation.x,
        ry: startRotation.y,
        rz: startRotation.z,
        rw: startRotation.w,
      }
      var endValues = {
        px: endPosition.x,
        py: endPosition.y,
        pz: endPosition.z,
        rx: endRotation.x,
        ry: endRotation.y,
        rz: endRotation.z,
        rw: endRotation.w,
      }
      var _this = this;
      this.tween = new TWEEN.Tween(startValues);
      this.tween.to(endValues, 3000).easing(TWEEN.Easing.Quadratic.In).onUpdate(function (obj) {
        _this.camera_3.position.set(obj.px, obj.py, obj.pz);
        _this.camera_3.quaternion.set(obj.rx, obj.ry, obj.rz, obj.rw);
        _this.onUpdate(_this.camera_3.position, cameraCircle.focusCenter);
      }).onComplete(function () {
        _this.tween = null;

        _this.onComplete(cameraCircle.focusCenter);
      }).start();
    }
  }

  update(t?: number) {
    t && this.tween && this.tween.update(t);
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
  private renderCalls: Set<(t?: number) => any> = new Set();
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
      var material = new THREE.MeshLambertMaterial({ color: 0x999999 });
      var plane = new THREE.Mesh(geometry, material);
      plane.receiveShadow = true; //default
      return plane;
    })(this.__descriptor.dimension));
    // init map controls
    this.mapControls = new MapControls(this.camera_3, this.renderer_3.domElement);
    this.registerRenderCall(this.mapControls.update);

    // init focus controls
    var _this = this;
    var _tmpRenderCall =  function (t? : number) { _this.focusControls.update(t)};
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
  public registerRenderCall(renderCall: (t?: number) => any) {
    this.renderCalls.add(renderCall);
  }
  public unregisterRenderCall(renderCall: (t?: number) => any) {
    this.renderCalls.delete(renderCall);
  }
  public renderOnce() {
    this.renderCalls.forEach(function (f) { f(0) });
    this.renderer_3.render(this.scene_3, this.camera_3);
  }
  public renderContinue(t?: number) {
    //
    if (t) {
      this.renderCalls.forEach(function (f) { f(t) });
      this.renderer_3.render(this.scene_3, this.camera_3);
    }
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
      case "SimpleCube":
        return new SimpleCube(k, this);
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
///////////////////////////
///////////////////////////
///////////////////////////
///////////////////////////
var kDescEx: krookiDescriptor = {
  dimension: { w: 100, h: 100 },
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
    archetype: 'SimpleCube',
    location: { x: (Math.random() * 100) - 50, y: (Math.random() * 100) - 50 },
    clickable: true
  })
}

var k = new Krooki(kDescEx, document.body);
k.renderContinue()
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
