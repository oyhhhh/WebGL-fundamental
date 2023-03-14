import {Mesh, Group, Camera, DirectionLight, PointLight, SpotLight, render, init} from "./render.js";

let camera;
let scene = [];
let light = [];

let height = 7; //盒子的高度
let array = []; //存储掉落的盒子所有类型的数组

let group; //物体总体

let dropcube; //掉落的新盒子
let currentcube; //物体所在的盒子
let dis = 20; //物体所在盒子和目标盒子之间的距离

let direction = 0; //物体跳的方向，0为向x轴正向，1为z轴负向
let scalex = 1, scaley = 1, scalez = 1; //物体放缩比例
let distance; //物体跳跃的距离
let curveControl = []; //物体跳跃曲线
let t = 1; //物体在曲线上的位置比例

let left,right0,right1; //物体跳跃后落点高度的边界判断
let l,r0,r1; //物体掉落的边界判断

let cameraflag = false; //相机是否移动
let dropflag = false; //物体是否掉落
let dir; //物体掉落的方向
let angle = 0; //物体掉落第一阶段的旋转角度
let dropf = false; //物体掉落第二部分
let cubeflag = false; //盒子是否掉落
let shakeflag = 0; //盒子掉落后抖动阶段



main();
animate();
function main() {
    let button = document.getElementsByTagName("button")[0];
    button.onclick = change;
    let canvas = document.getElementById('three');
    let gl = canvas.getContext('webgl2');

    if(!gl) {
        return;
    }

    init(gl);

    camera = new Camera(45, gl.canvas.width/gl.canvas.height, 0.1, 1000);
    camera.setPosition(-10, 40, 40);
    
    let directionLight = new DirectionLight({color: 0xffffff, direction: [-1, -1, -2]})

    const geometry1 = {
      type: "cylinder",
      size: [1.6, 4, 2],
      position: [0, -1.5, 0]
    }
    const geometry2 = {
      type: "sphere",
      size: [1.6, 1.6, 1.6],
      position: [0, 2.7, 0]
    }
    const material = {
      type: "light_sensitive",
      color: 0x330099
    }
    const cylinder = new Mesh(geometry1, material);
    const sphere = new Mesh(geometry2, material);


    group = new Group(cylinder, sphere);
    group.setPosition(-10, height, 0);



    const cube = {
      type: "box",
      size: [10, height, 10]
    }
    const material1 = {
      type: "light_sensitive",
      color: 0xFFB3FF
    }
    const material2 = {
      type: "light_sensitive",
      color: 0x99CCCC
    }
    const material3 = {
      type: "light_sensitive",
      color: 0xCCBBFF
    }
    const mesh1 = new Mesh(cube, material1);
    const mesh2 = new Mesh(cube, material2);
    const mesh3 = new Mesh(cube, material3);
    array = [mesh1, mesh2, mesh3];


    currentcube = array[Math.round(Math.random()*2)].clone();
    currentcube.setPosition( -10, 0, 0 );
    dropcube = array[Math.round(Math.random()*2)].clone();
    dropcube.setPosition(10, 0, 0); 

    scene.push(currentcube, dropcube, group);
    light.push(directionLight);


   // render([currentcube, dropcube, group], camera, [directionLight]);
   // window.addEventListener('resize', render([mesh1, mesh2], camera, [directionLight]));
    
}

function animate() {
    requestAnimationFrame( animate );

    if(cameraflag) {
      if(camera.position[0] < currentcube.position[0] - 10) {
          camera.setPosition(++camera.position[0], camera.position[1], camera.position[2]);
          camera.setTarget(camera.position[0] + 10, camera.position[1] - 50, camera.position[2] - 50);
      }
      if(camera.position[2] > currentcube.position[2] + 50) {
          camera.setPosition(camera.position[0], camera.position[1], --camera.position[2]);
          camera.setTarget(camera.position[0] + 10, camera.position[1] - 50, camera.position[2] - 50);
      }
      if(camera.position[0] >= currentcube.position[0] - 10 && camera.position[2] <= currentcube.position[2] + 50) {
          cameraflag = false;
      }
    }

    //物体起跳动画
    if(t < 1) {
        moveOnCurve(curveControl, t);
        t += 0.1;
        if(t >= 1) {
            createNewCube()
        }
    }

  //物体摔倒动画
    if(dropflag) {
        angle += 0.1;
        
        if(!direction) {
            group.position[0] += 0.2*(1 - dir) -0.2 * dir;
            group.rotateZ( -angle* (1 - dir) + angle * dir);
        } else {
            group.position[2] -= 0.2*(1 - dir) -0.2 * dir;
            group.rotateX( -angle* (1 - dir) + angle * dir);       
        }
        
        if(angle >= Math.PI/2) {
            dropf = true; 
            dropflag = false; 
            angle = 0; 
        }                
    }

    if(dropf) {
            group.setPosition(group.position[0], group.position[1] - 0.2, group.position[2]);
            if(group.position[1] <= -2.7) dropf = false;
        }

    //盒子落下动画
    if(cubeflag) {
        
        if(shakeflag == 0) {
            dropcube.setPosition(dropcube.position[0], dropcube.position[1] - 5, dropcube.position[2]);
            if(dropcube.position[1] == 0)
            shakeflag = 1;
        }
        if(shakeflag == 1) {
          dropcube.setPosition(dropcube.position[0], dropcube.position[1] + 2, dropcube.position[2]);
            if(dropcube.position[1] == 10) {
                shakeflag = 2;
            }
        }
        if(shakeflag == 2) {
            dropcube.setPosition(dropcube.position[0], dropcube.position[1] - 2, dropcube.position[2]);
            if(dropcube.position[1] == 0) {
                shakeflag = 3;
            }
        }
        if(shakeflag == 3) {
            dropcube.setPosition(dropcube.position[0], dropcube.position[1] + 1.5, dropcube.position[2]);
            if(dropcube.position[1] >= 5) {
                shakeflag = 4;
            }
        }
        if(shakeflag == 4) {
            dropcube.setPosition(dropcube.position[0], dropcube.position[1] - 1.5, dropcube.position[2]);
            if(dropcube.position[1] == 0) {
                shakeflag = 0;
                cubeflag = false;
            }
        }
    }
    
    render(0xFFFFCC, scene, camera, light);
 // renderer.render( scene, camera );
}

function change() {
    let interval;
    window.addEventListener('mousedown', (e) => {
        
        scalex = 1; //物体放缩比例
        scaley = 1; 
        scalez = 1;
        distance = 0; //物体跳的距离

        //物体将会随着鼠标点击而压缩以及增加跳的距离
        interval = setInterval(() => {
            group.scale(1.05, 0.95, 1.05);
           // geometry2.scale(1.05, 0.95, 1.05);
            distance += 3;
            scalex *= 1.05;
            scaley *= 0.95;
            scalez *= 1.05; 
            }, 200);
    })

    window.addEventListener('mouseup', (e) => {
        clearInterval(interval);

        //物体恢复原样
        group.scale(1/scalex, 1/scaley, 1/scalez);
        //geometry2.scale(1/scalex, 1/scaley, 1/scalez);
        //这个curve要根据方向来判断是x还是z加distance
     
        //判断物体是否是斜着跳
        let isalpha;
        if(Math.abs(dropcube.position[2] - group.position[2]) <= 0.001 || Math.abs(dropcube.position[0] - group.position[0]) <= 0.001) {
            isalpha = 0;
        } else isalpha = 1;

        let cosalpha;//计算斜着跳的角度
        cosalpha = Math.abs(dropcube.position[0] - group.position[0])/distance * direction +
                   Math.abs(dropcube.position[2] - group.position[2])/distance * (1 - direction);
        
        
        //left,right0,right1分别定义起落边界，在此边界内物体的高度将模拟落在平台上的高度
        //l,r0,r1分别定义物体会从平台摔下来的边界，在此范围内物体虽然落在平台上但最终会摔下来
        if(!isalpha) {
            left = (currentcube.position[0] - group.position[0] + 5) * (1 - direction) + (group.position[2] - currentcube.position[2] + 5) * direction;
            right0 = dropcube.position[0]*(1 - direction) - dropcube.position[2]*direction - group.position[0]*(1 - direction) + group.position[2]*direction - 6;
            right1 = dropcube.position[0]*(1 - direction) - dropcube.position[2]*direction + 6 - group.position[0]*(1 - direction) + group.position[2]*direction;
            l = left - 1;
            r0 = right0 + 1;
            r1 = right1 - 1;

        } else {
            left = 6/Math.sin(Math.acos(cosalpha));
            right0 = (dis - 6)/Math.sin(Math.acos(cosalpha));
            right1 = (dis + 6)/Math.sin(Math.acos(cosalpha));
            l = 5/Math.sin(Math.acos(cosalpha));
            r0 = (dis - 5)/Math.sin(Math.acos(cosalpha));
            r1 = (dis + 5)/Math.sin(Math.acos(cosalpha));
        }

        //物体的落点不同其高度不同（落在地面和落在平台）
        let positiony;
        if(distance < left || (right0 < distance && right1 > distance)) {
            positiony = group.position[1];
            if((distance >= l && distance < left) ||  (distance > left && distance <= r0) || distance >= r1) {
                setTimeout(()=>{dropflag = true},400) //物体先跳跃再摔倒，因此异步执行摔倒动画
               
                if(distance <= r0 && right0 < distance) { //设置摔倒的方向（向前或者向后）
                    console.log("前")
                    dir = 1;
                } else {
                    console.log("后")
                    dir = 0;
                } 
            }

        } else {
            positiony = 0;
        }  
            //三维贝塞尔曲线模拟物体跳跃曲线
            if(isalpha) {
                curveControl = [];
                curveControl.push(group.position); 
                curveControl.push([group.position[0] + distance/2*(1 - direction), group.position[1] + distance, group.position[2] - distance/2*direction]);
                curveControl.push([(group.position[0] + distance)*(1 - direction) + dropcube.position[0] * direction , positiony, (group.position[2] - distance)*direction + dropcube.position[2] * (1 - direction)]);
                
            } else {
                curveControl = [];
                curveControl.push(group.position); 
                curveControl.push([group.position[0] + distance/2*(1 - direction), group.position[1] + distance, group.position[2] - distance/2*direction]);
                curveControl.push([(group.position[0] + distance*Math.sin(Math.acos(cosalpha)))*(1 - direction) + dropcube.position[0] * direction , positiony, (group.position[2] - distance*Math.sin(Math.acos(cosalpha)))*direction + dropcube.position[2] * (1 - direction)]);
              
            }
            

        t = 0;

    })

}

function moveOnCurve(curveControl, t){
    let p0 = curveControl[0];
    let p1 = curveControl[1];
    let p2 = curveControl[2];

    let xPos = p0[0] * (1 - t) * (1 - t) + 2 * t * (1 - t) * p1[0] + t * t * p2[0];
    let yPos = p0[1] * (1 - t) * (1 - t) + 2 * t * (1 - t) * p1[1] + t * t * p2[1];
    let zPos = p0[2] * (1 - t) * (1 - t) + 2 * t * (1 - t) * p1[2] + t * t * p2[2];
    
    group.setPosition(xPos, yPos, zPos);

}

function createNewCube(){
  if(r0 < distance && r1 > distance ) {
      cameraflag = true;
      currentcube = dropcube;
      dropcube = array[Math.round(Math.random()*2)].clone();
      direction = Math.round(Math.random());//随机掉落一个盒子
      dis = Math.random()*10 + 20;//随机赋值盒子
      dropcube.setPosition(dis * (1 - direction) + currentcube.position[0], 100, (- dis) * direction + currentcube.position[2]);
      console.log(dropcube)
      scene.push(dropcube);
      cubeflag = true;
                  
  } else{
      setTimeout(()=>{
          let r = window.confirm("Game Over!");
          if(r) {
              location.reload()
          }
          }, 1500) //等待异步动画执行完之后再弹出
      }
}

export {change};



