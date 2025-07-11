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
const units = {
    width: window.innerWidth,
    height: window.innerHeight,
    cameraWidth: 800,
    cameraHeight: 600,
    cameraFOV: (0.8 * 180) / Math.PI,
    cameraRatio: 800 / 600
}
const clock = new THREE.Clock()
const mixers = []
let onRenderFcts = []

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
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.outputEncoding = THREE.sRGBEncoding
renderer.physicallyCorrectLights = true
// renderer.domElement.style.position = 'absolute'
// renderer.domElement.style.top = '0px'
// renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement )

//////////////////////////////////////////////////////////////////////////////////
//		Create scene, camera, lights
//////////////////////////////////////////////////////////////////////////////////
const scene = new THREE.Scene()
// Create a camera
const camera = new THREE.PerspectiveCamera(units.cameraFOV, units.cameraRatio, 0.1, 1000)
scene.add(camera)

const ambientLight = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( ambientLight )

const directionalLight = new THREE.DirectionalLight( 0xFFFFFF )
directionalLight.position.set( 4, 8, 0 )
scene.add( directionalLight )

const axesHelper = new THREE.AxesHelper( 5 )
scene.add( axesHelper )
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

// listener for end loading of NFT marker
window.addEventListener('arjs-nft-loaded', function(e){
    console.log(e)
})

function onResize(){
    arToolkitSource.onResizeElement()
    arToolkitSource.copyElementSizeTo(renderer.domElement)
    if( arToolkitContext.arController !== null ){
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
    }
}

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

// init controls for camera
const markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
    type: 'nft',
    descriptorsUrl: '/data/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched',
    changeMatrixMode: 'cameraTransformMatrix'
});

scene.visible = false

const root = new THREE.Object3D()
scene.add(root)

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////
const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshNormalMaterial({
//     color: 0x48727f,
//     side: THREE.DoubleSide
// })
const material = new THREE.MeshStandardMaterial( { color: 0x48727f } ) 
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 290;
cube.scale.set(100, 100, 100);
root.matrixAutoUpdate = false;
root.add(cube)

window.addEventListener('arjs-nft-init-data', function(nft) {
    const msg = nft.detail
    cube.position.z = -(msg.height / msg.dpi * 2.54 * 10)/2.0; //y axis?
    cube.position.x = (msg.width / msg.dpi * 2.54 * 10)/2.0; //x axis?
})

const threeGLTFLoader = new GLTFLoader();
let model;

threeGLTFLoader.load("Flamingo.glb", function (gltf) {
    console.log('gltf', gltf)
    model = gltf.scene.children[0]
    //model.name = 'Flamingo';
    //const clips = gltf.animations;
    if(gltf.animations && gltf.animations.length > 0) {
        const animation = gltf.animations[0]

        const mixer = new THREE.AnimationMixer(model)
        mixers.push(mixer)

        const action = mixer.clipAction(animation)
        action.play()
    }

    root.add(model)
    root.matrixAutoUpdate = false
    model.position.z = 0

    window.addEventListener('arjs-nft-init-data', function(nft) {
        const msg = nft.detail
        model.position.y = (msg.height / msg.dpi * 2.54 * 10)/2.0 + 2; //y axis?
        model.position.x = (msg.width / msg.dpi * 2.54 * 10)/2.0; //x axis?
    })

    console.log('Model loaded:', model)
})

//////////////////////////////////////////////////////////////////////////////////
//		render functions
//////////////////////////////////////////////////////////////////////////////////
onRenderFcts.push(function () {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
        return
    }
    if (mixers.length > 0) {
        for (let i = 0; i < mixers.length; i++) {
            mixers[i].update(clock.getDelta())
        }
    }
    arToolkitContext.update(arToolkitSource.domElement)

    // update scene.visible if the marker is seen
    scene.visible = camera.visible
    renderer.render(scene, camera)
})

onRenderFcts.push(function (delta) {
    cube.rotation.y += 0.01
    cube.rotation.x += 0.01
})
//////////////////////////////////////////////////////////////////////////////////
//		execute animation loop
//////////////////////////////////////////////////////////////////////////////////
let lastTimeMsec;
requestAnimationFrame(function draw(nowMsec) {
    requestAnimationFrame( draw )

    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
    const deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec = nowMsec

    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })
})