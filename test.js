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
    camera.setPosition(10, 0, 30);
    camera.setTarget(0, 0, 0);
    
    let directionLight = new DirectionLight({color: 0xffffff});

    const geometry1 = {
      type: "cylinder",
      size: [1.6, 4, 2],
      position: [0, -1.5, 0]
    }
    const geometry2 = {
      type: "sphere",
      size: [3, 3, 3],
      position: [0, 2.7, 0]
    }
    const material = {
      type: "light_sensitive",
      color: 0x330099
    }
    const cylinder = new Mesh(geometry1, material);
    const sphere = new Mesh(geometry2, material);


    const group = new Group(cylinder, sphere);

    group.setPosition(10, 0, 0)
    group.rotateX(Math.PI/2);
    group.rotateY(Math.PI/2);
    group.rotateZ(Math.PI/2);
    


    render(0xFFFFCC, [group], camera, [directionLight]);
    
}