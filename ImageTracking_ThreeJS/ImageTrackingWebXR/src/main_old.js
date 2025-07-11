import './style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { THREEx, ARjs } from "@ar-js-org/ar.js-threejs"

console.log(THREEx)

//scene size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

THREEx.ArToolkitContext.baseURL = "./";

const onRenderFcts = [];
let arToolkitContext, arMarkerControls;

//scene and camera
const scene = new THREE.Scene()
//const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 )
const camera = new THREE.PerspectiveCamera()
camera.position.z = 5


const ambientLight = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( ambientLight )

const directionalLight = new THREE.DirectionalLight( 0xFFFFFF )
directionalLight.position.set( 4, 8, 0 )
scene.add( directionalLight )   

//renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true, 
    alpha: true,
    precision: 'mediump',
    premultipliedAlpha: true,
    stencil: true,
    depth: true,
    logarithmicDepthBuffer: true
})

renderer.setSize( sizes.width, sizes.height )
document.body.appendChild( renderer.domElement )

//enable AR


const arToolkitSource = new THREEx.ArToolkitSource({
    // to read from the webcam
    sourceType: 'webcam',

    sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
    sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
});

arToolkitSource.init(function onReady() {

    arToolkitSource.domElement.addEventListener('canplay', () => {
        console.log(
            'canplay',
            'actual source dimensions',
            arToolkitSource.domElement.videoWidth,
            arToolkitSource.domElement.videoHeight,
        );
        initARContext();
    });
    window.arToolkitSource = arToolkitSource;
    setTimeout(() => {
        onResize()
    }, 2000);
}, function onError() { })

function onResize() {
    console.debug("resize")
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera aspect ratio
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update the renderer
    renderer.setSize(sizes.width, sizes.height)
    //renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Update the ARToolkitSource
    arToolkitSource.onResizeElement()
    arToolkitSource.copyElementSizeTo(renderer.domElement)
    if (window.arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(window.arToolkitContext.arController.canvas)
    }
}

function initARContext() { // create atToolkitContext
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: THREEx.ArToolkitContext.baseURL + './data/camera_para.dat',
        detectionMode: 'mono',
    })

    // initialize it
    arToolkitContext.init(() => { // copy projection matrix to camera
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());

        // arToolkitContext.arController.orientatio = getSourceOrientation();
        // arToolkitContext.arController.options.orientation = getSourceOrientation();

        console.log('arToolkitContext', arToolkitContext);
        window.arToolkitContext = arToolkitContext;
    })

    // MARKER
    arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type: 'nft',
        descriptorsUrl: '/data/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched',
        changeMatrixMode: 'cameraTransformMatrix'
    })

    scene.visible = false

    console.log('ArMarkerControls', arMarkerControls);
    window.arMarkerControls = arMarkerControls;
}

function getSourceOrientation() {
    if (!arToolkitSource) {
        return '';
    }

    console.log(
        'actual source dimensions',
        arToolkitSource.domElement.videoWidth,
        arToolkitSource.domElement.videoHeight
    );

    if (arToolkitSource.domElement.videoWidth > arToolkitSource.domElement.videoHeight) {
        console.log('source orientation', 'landscape');
        return 'landscape';
    } else {
        console.log('source orientation', 'portrait');
        return 'portrait';
    }
}


// listener for end loading of NFT marker
window.addEventListener('arjs-nft-loaded', function(e){
    console.log("arjs-nft-loaded", e);
})

window.addEventListener('arjs-nft-init-data', function(nft) {
    console.log('arjs-nft-init-data', nft);
    if (nft.detail && nft.detail.descriptorsUrl) {
        arMarkerControls.descriptorsUrl = nft.detail.descriptorsUrl;
        arMarkerControls.update();
    }
})

onRenderFcts.push(function () {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
        return;
    }

    arToolkitContext.update(arToolkitSource.domElement)

    // update scene.visible if the marker is seen
    scene.visible = camera.visible
})

//scene contents
const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 )
const cubeMaterial = new THREE.MeshStandardMaterial( { color: 0x48727f } ) 
const cube = new THREE.Mesh( cubeGeometry, cubeMaterial )
cube.position.y = 1

scene.add( cube )

onRenderFcts.push(function () {
    renderer.render(scene, camera);
})

//animation

onRenderFcts.push(function (delta) {
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
})

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



window.addEventListener('resize', ()=>{
    onResize()
})