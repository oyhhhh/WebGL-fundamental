import {Mesh, Group, Camera, DirectionLight, PointLight, SpotLight, render, init} from "./render.js";

main();

function main() {
    let canvas = document.getElementById('three');
    let gl = canvas.getContext('webgl2');

    if(!gl) {
        return;
    }

    init(gl);

    let camera = new Camera(45, gl.canvas.width/gl.canvas.height, 0.1, 1000);
    camera.setPosition(-10, 10, 40);
    
    let directionLight = new DirectionLight({color: 0xffffff, direction: [-1, -1, -2]});

    const cube = {
      type: "sphere",
      size: [10, 10, 10]
    }
    const material1 = {
      type: "normal",
      src: './images/earth.jpg'
    }
    const mesh1 = new Mesh(cube, material1);



    render(0xFFFFCC, [mesh1], camera, [directionLight]);
    
}