import './style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { THREEx, ARjs } from "@ar-js-org/ar.js-threejs"

//////////////////////////////////////////////////////////////////////////////////
//		Set global values
//////////////////////////////////////////////////////////////////////////////////
THREEx.ArToolkitContext.baseURL = "."

//scene size
let units = {
    width: window.innerWidth,
    height: window.innerHeight,
    cameraWidth: 800,
    cameraHeight: 600,
    cameraFOV: (0.8 * 180) / Math.PI,
    cameraRatio: 800 / 600,
    cameraNear: 0.01,
    cameraFar: 10000
}

let onRenderFunctions = []


//////////////////////////////////////////////////////////////////////////////////
//		Create scene, camera, lights
//////////////////////////////////////////////////////////////////////////////////
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( units.cameraFOV, units.width / units.height, units.cameraNear, units.cameraFar )
camera.position.z = 5
camera.position.y = 2
scene.add( camera );

const ambientLight = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( ambientLight )

const directionalLight = new THREE.DirectionalLight( 0xFFFFFF )
directionalLight.position.set( 4, 8, 0 )
scene.add( directionalLight )

//////////////////////////////////////////////////////////////////////////////////
//		Create a renderer
//////////////////////////////////////////////////////////////////////////////////
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    precision: 'mediump',
    premultipliedAlpha: true,
    stencil: true,
    depth: true,
    logarithmicDepthBuffer: true,
});
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize(units.width, units.height)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
document.body.appendChild( renderer.domElement )


////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////
const arToolkitSource = new THREEx.ArToolkitSource({
    sourceType : 'webcam',
    sourceWidth: window.innerWidth > window.innerHeight ? units.cameraWidth : units.cameraHeight,
    sourceHeight: window.innerWidth > window.innerHeight ? units.cameraHeight : units.cameraWidth
})

arToolkitSource.init(function onReady(){
    // use a resize to fullscreen mobile devices
    setTimeout(function() {
        onResize()
    }, 1000)
})

// TODO: handle resize
window.addEventListener('resize', function(){
    onResize()
})

////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////
// create atToolkitContext
const arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '/data/camera_para.dat',
    detectionMode: 'mono',
    canvasWidth: units.cameraWidth,
    canvasHeight: units.cameraHeight,
}, {
    sourceWidth: units.cameraWidth,
    sourceHeight: units.cameraHeight,
})

// initialize it
arToolkitContext.init(function onCompleted(){
    // copy projection matrix to camera
    camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() )
})

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////
const markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
    type: 'nft',
    descriptorsUrl: '/data/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched',
    changeMatrixMode: 'cameraTransformMatrix'
})

markerControls.addEventListener('markerFound', function() {
    console.log('Marker found')
})

markerControls.addEventListener('markerLost', function() {
    console.log('Marker lost')
})
//////////////////////////////////////////////////////////////////////////////////
//		Create a root object
//////////////////////////////////////////////////////////////////////////////////
const root = new THREE.Object3D()
root.matrixAutoUpdate = false
const axesHelper = new THREE.AxesHelper( 500 )
root.add( axesHelper )
scene.add(root)

scene.visible = false
//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////
//scene contents
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial( { color: 0x48727f } ) 
const cube = new THREE.Mesh(geometry, material);
cube.scale.set(100, 100, 100);

root.add( cube )

window.addEventListener('arjs-nft-init-data', function(nft) {
    const data = nft.detail
    cube.position.z = -(data.height / data.dpi * 2.54 * 10)/2.0;
})

const threeGLTFLoader = new GLTFLoader()
let model
const mixers = []

threeGLTFLoader.load("models/Flamingo.glb", function (gltf) {
    console.log('gltf', gltf)
    model = gltf.scene.children[0]
    if(gltf.animations && gltf.animations.length > 0) {
        const animation = gltf.animations[0]
        const mixer = new THREE.AnimationMixer(model)
        mixers.push(mixer)

        const action = mixer.clipAction(animation)
        action.play()
    }

    root.add(model)

    window.addEventListener('arjs-nft-init-data', function(nft) {
        const msg = nft.detail
        model.position.z = -(msg.height / msg.dpi * 2.54 * 10)/2.0 - 200;
    })
})

//////////////////////////////////////////////////////////////////////////////////
//		render functions
//////////////////////////////////////////////////////////////////////////////////
onRenderFunctions.push(function () {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) return
    // update arToolkitSource
    arToolkitContext.update(arToolkitSource.domElement)

    // update scene.visible if the marker is seen
    scene.visible = camera.visible
    renderer.render(scene, camera)
})

onRenderFunctions.push(function () {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
})

const clock = new THREE.Clock()
onRenderFunctions.push(function () {
    if (mixers.length > 0) {
        for (let i = 0; i < mixers.length; i++) {
            mixers[i].update(clock.getDelta())
        }
    }
})

//////////////////////////////////////////////////////////////////////////////////
//		execute animation loop
//////////////////////////////////////////////////////////////////////////////////
function draw() {
	requestAnimationFrame( draw )

	onRenderFunctions.forEach(function (renderFunction) {
        renderFunction()
    })
}
draw()

function onResize(){
  arToolkitSource.onResizeElement()
  arToolkitSource.copyElementSizeTo(renderer.domElement)
  if( arToolkitContext.arController !== null ){
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
  }
  units.width = window.innerWidth
  units.height = window.innerHeight

  // Update camera aspect ratio
  camera.aspect = units.width / units.height
  camera.updateProjectionMatrix()

  // Update the renderer
  renderer.setSize(units.width, units.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}