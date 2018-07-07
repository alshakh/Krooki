
/// 
import * as THREE from 'three';
import { MapControls } from './MapControls'
import * as TWEEN from '@tweenjs/tween.js'
import { Camera } from 'three';
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
      obj.children.forEach(this.assignReversePointer);
    }
  }

  public abstract getBoundingBox() : THREE.Box3;
  public getCentroid() {
    var t = this.getBoundingBox();
    return new THREE.Vector3(
      (t.max.x + t.min.x) / 2,
      (t.max.y + t.min.y) / 2,
      (t.max.z + t.min.z) / 2);
  }
  public abstract focus():void;
  public abstract unfocus():void;
}
//
class SimpleCube extends KrookiElement {
  private object_3: THREE.Object3D;
  private focusBox: THREE.BoxHelper | null = null;
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
}
// class TestGroup  extends KrookiElement{
//   case "TestGroup":
//   return (function () {
//     var geometry = new THREE.BoxGeometry(1, 1, 1);
//     geometry.translate(0, 0, 0.5);
//     var material = new THREE.MeshPhongMaterial({ color: "#aaff99" });
//     var cube = new THREE.Mesh(geometry, material);
//     cube.castShadow = true; //default is false
//     cube.position.set(2, 2, 2)
//     var g = new THREE.Group();
//     g.add(cube);
//     var c1 = cube.clone()
//     c1.position.set(-2, -1, 1);
//     g.add(c1);
//     return { material: material, object: g };
//   })()
// }
class FocusControls {
 
  private readonly camera_3 : THREE.Camera;
  
  constructor(camera : THREE:Camera) {
    this.camera_3 : 
  }
}
class Krooki {
  public readonly __descriptor: krookiDescriptor;
  public readonly scene_3: THREE.Scene;
  private readonly camera_3: THREE.Camera;
  private readonly renderer_3: THREE.Renderer;
  private readonly containerDom: HTMLElement;
  private readonly elements: KrookiElement[];
  //
  private readonly mapControls : any;
  //
  private renderCalls: ((t?: number) => any)[] = [];
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


  }
  //
  public registerRenderCall(renderCall: (t?: number) => any) {
    this.renderCalls.push(renderCall);
  }
  public unregisterRenderCall(renderCall: (t?: number) => any) {
    let index = this.renderCalls.indexOf(renderCall);
    if (index !== -1) {
      this.renderCalls.splice(index, 1);
    }
  }
  public renderOnce() {
    this.renderCalls.forEach(function(f) { f(0) });
    this.renderer_3.render(this.scene_3, this.camera_3);
  }
  public renderContinue(t ? : number) {
    var _this = this;
    //
    if ( t ) {
      this.renderCalls.forEach(function(f) { f(t) });
      this.renderer_3.render(this.scene_3, this.camera_3);
    }
    requestAnimationFrame(function (t) { _this.renderContinue(t) ; });
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

  private _focusedElement : KrookiElement |null = null;
  focusOnElement(el: KrookiElement) {
    if(! this._focusedElement) { el.unfocus()};
    //
    el.focus();
    var boundingBox = el.getBoundingBox();
    var centroid = el.getCentroid();

    var cameraCircle: { focusCenter: THREE.Vector3, center: THREE.Vector3, radius: number } = {
      center: new THREE.Vector3(centroid.x, centroid.y, centroid.z + (boundingBox.max.z - boundingBox.min.z) * 2),
      radius: Math.max(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y) * 2,
      focusCenter: centroid,
    }
    // tweenObj = new TWEEN.Tween(sceneInfo.camera.position.clone()).to({
    //   x: cameraCircle.center.x + cameraCircle.radius,
    //   y: cameraCircle.center.y,
    //   z: cameraCircle.center.z
    // }, 3000).easing(TWEEN.Easing.Quadratic.In).onUpdate(function (obj) {
    //   console.log(obj);
    //   sceneInfo.camera.position.set(obj.x, obj.y, obj.z);
    //   sceneInfo.camera.lookAt(cameraCircle.focusCenter);
    //   mapControls.target = cameraCircle.focusCenter;
    // }).start();
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
    //   {
    //   archetype: 'TestGroup',
    //   location: { x: 10, y: 10 },
    //   clickable: true,
    // }
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