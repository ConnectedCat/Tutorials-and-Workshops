import './style.css'
import * as THREE from 'three'

//scene size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

//scene
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 )
camera.position.z = 5
camera.position.y = 2

const ambientLight = new THREE.AmbientLight( 0x404040 ) // soft white light
scene.add( ambientLight )

const directionalLight = new THREE.DirectionalLight( 0xFFFFFF )
directionalLight.position.set( 4, 8, 0 )
scene.add( directionalLight )   

//renderer
const renderer = new THREE.WebGLRenderer()
renderer.setSize( sizes.width, sizes.height )
document.body.appendChild( renderer.domElement )

//scene contents
const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 )
const cubeMaterial = new THREE.MeshStandardMaterial( { color: 0x48727f } ) 
const cube = new THREE.Mesh( cubeGeometry, cubeMaterial )
cube.position.y = 1

scene.add( cube )

renderer.render( scene, camera ) 

//animation
function draw() {
    requestAnimationFrame( draw )

    cube.rotation.x += 0.01
    cube.rotation.y += 0.01

    renderer.render( scene, camera )
}
draw()



window.addEventListener('resize', ()=>{
    console.debug("resize")
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera aspect ratio
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update the renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})