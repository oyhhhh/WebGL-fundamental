import { Shader } from "./shader.js";
import { GeometryBuffer } from "./geometryBuffer.js";
import { Texture } from "./texture.js";
import { vShader as vShader1, fShader as fShader1 } from "./shaderSource/Shader1.js";
import { vShader as vShader2, fShader as fShader2 } from "./shaderSource/Shader2.js";

let shaderArr = [];
let vaoArr = [];
let gl;

//相机类 存储相机的位置和视角
class Camera {
    constructor(fovy, aspect, near, far) {
        this.setPerspective(fovy, aspect, near, far);
        this.position = [0, 0, 5];
        this.target = [0, 0, 0];
        this.setView();
    }
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.setView();
    }
    setTarget(x, y, z) {
        this.target = [x, y, z];
        this.setView();
    }
    setPerspective(fovy, aspect, near, far) {
        this.perspective = glMatrix.mat4.create();
        glMatrix.mat4.perspective(this.perspective, fovy, aspect, near, far);
    }
    setView() {
        if(!(this.position[0] == 0 && this.position[2] == 0))
        this.view = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.position, this.target, [0, 1, 0]);
        else {
            if(this.position[1] > 0)
            this.view = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.position, this.target, [0, 0, -1]);
            else
            this.view = glMatrix.mat4.lookAt(glMatrix.mat4.create(), this.position, this.target, [0, 0, 1]);
        }
    }

}

//平行光类 属性有颜色和方向
class DirectionLight {
    constructor(object) {
        this.setColor(object.color);
        this.setDirection(object.direction);
    }
    setColor(color) {
        this.color = color ? color : 0xffffff;
    }
    setDirection(direction) {
        this.direction = direction ? direction : [0, -1, 0];
    }
}

//点光源类 属性有颜色、位置和衰减参数
class PointLight {
    constructor(object) {
        this.setColor(object.color);
        this.setPosition(object.position);
        this.setParameter(object.constant, object.linear, object.quadratic);
    }
    setColor(color) {
        this.color = color ? color : 0xffffff;
    }
    setPosition(position) {
        this.position = position ? position : [0, 100, 0];
    }
    setParameter(constant, linear, quadratic) {
        this.constant = constant ? constant : 1.0;
        this.linear = linear ? linear : 0.09;
        this.quadratic = quadratic ? quadratic : 0.032;
    }
}

//聚光灯类 属性有颜色、位置、方向、衰减参数和切光角
class SpotLight {
    constructor(object) {
        this.setColor(object.color);
        this.setPosition(object.position);
        this.setDirection(object.direction);
        this.setRad(object.cutOff, object.outerCutOff);
        this.setParameter(object.constant, object.linear, object.quadratic);
    }
    setColor(color) {
        this.color = color ? color : 0xffffff;
    }
    setPosition(position) {
        this.position = position ? position : [0, 100, 0];
    }
    setDirection(direction) {
        this.direction = direction ? direction : [0, -1, 0];
    }
    setRad(cutOff, outerCutOff) {
        this.cutOff = cutOff ? cutOff : Math.cos(12.5 / 180 * Math.PI);
        this.outerCutOff = outerCutOff ? outerCutOff : Math.cos(17.5 / 180 * Math.PI);

    }
    setParameter(constant, linear, quadratic) {
        this.constant = constant ? constant : 1.0;
        this.linear = linear ? linear : 0.09;
        this.quadratic = quadratic ? quadratic : 0.032;
    }

}

//物体类 组合物体几何形状和材质
//某些属性其实可以写成只读/不可枚举，这里还有待处理
class Mesh {
    constructor(object, material) {
        this.object = object;
        this.material = material;
        this.position = object.position ? object.position : [0, 0, 0];
        this.size = object.size ? object.size : [1, 1, 1];
        this.type = object.type;
        if (material.src) {
            this.textureID = [];
            if (typeof material.src == "string") {
                let texture = new Texture(gl, material.src);
                this.textureID.push(texture.id);
            } else {
                material.src.forEach(value => {
                    let texture = new Texture(gl, value);
                    this.textureID.push(texture.id);
                });
            }

        }
        this.radX = 0;
        this.radY = 0;
        this.radZ = 0;
        this.setModel();
    }
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.setModel();
    }
    setColor(color) {
        this.material.color = color;
    }
    setTexture(material) {
        material.src.forEach(value => {
            let texture = new Texture(gl, value);
            this.textureID.push(texture.id);
        });
    }
    rotateX(rad) {
        this.radX = rad;
        this.setModel();
    }
    rotateY(rad) {
        this.radY = rad;
        this.setModel();
    }
    rotateZ(rad) {
        this.radZ = rad;
        this.setModel();
    }
    scale(x, y, z) {
        this.size = [this.size[0] * x, this.size[1] * y, this.size[2] * z]
        this.setModel();
    }
    setModel() {
        let model = glMatrix.mat4.create();
        let smodel = glMatrix.mat4.create();
        let rmodel = glMatrix.mat4.create();
        let rmodelx = glMatrix.mat4.create();
        let rmodely = glMatrix.mat4.create();
        let rmodelz = glMatrix.mat4.create(); 
        let tmodel = glMatrix.mat4.create();

        glMatrix.mat4.scale(smodel, smodel, this.size);
        glMatrix.mat4.rotate(rmodel, rmodel, this.radX, [1, 0, 0]);
        glMatrix.mat4.rotate(rmodel, rmodel, this.radY, [0, 1, 0]);
        glMatrix.mat4.rotate(rmodel, rmodel, this.radZ, [0, 0, 1]);
        glMatrix.mat4.translate(tmodel, tmodel, this.position);

      /*  glMatrix.mat4.multiply(rmodel, rmodely, rmodelx);
        glMatrix.mat4.multiply(rmodel, rmodelz, rmodel);*/

        //先放缩再旋转再平移
        glMatrix.mat4.multiply(model, rmodel, smodel);
        glMatrix.mat4.multiply(model, tmodel, model);
        this.model = model;
    }
    clone() {
        let newMesh = new Mesh(this.object, this.material);
        Object.assign(newMesh, this);
        return newMesh;

    }

}

class Group {
    constructor(...meshs) {
        this.group = meshs;
        //相对位置：存储物体第一次设置时的位置(作为局部坐标)
        this.relativePos0 = meshs.map(value => value.position);
        //相对位置(世界坐标内)
        this.relativePos = meshs.map(value => value.position);
        //记录整体的旋转角
        this.radX = 0;
        this.radY = 0;
        this.radZ = 0;
    }
    setPosition(x, y, z) {
        this.position = [x, y, z];
        this.group.forEach((value, index) => {
            //物体位移会受相对位置的影响
            value.setPosition(x + this.relativePos[index][0], y + this.relativePos[index][1], z + this.relativePos[index][2])
        })

    }
    scale(x, y, z) {
        this.group.forEach((value, index) => {
            //物体放缩会改变相对位置
            this.relativePos[index] = [this.relativePos[index][0] * x, this.relativePos[index][1] * y, this.relativePos[index][2] * z];
            value.scale(x, y, z)
        })
    }
    rotateX(rad) {
        this.group.forEach((value, index) => {
            this.radX = rad;
            //物体旋转是在自己坐标系下旋转，这里为了实现整体的旋转，重新计算物体旋转后在世界坐标内的相对位置，从而对物体位置进行更改
            let value0 = this.relativePos[index];
            this.rotateRelative(index);
            value.position = value.position.map((value, i) => value + this.relativePos[index][i] - value0[i])
            value.rotateX(rad)
        })
    }
    rotateY(rad) {
        this.group.forEach((value, index) => {
            this.radY = rad;
            let value0 = this.relativePos[index];
            this.rotateRelative(index);
            value.position = value.position.map((value, i) => value + this.relativePos[index][i] - value0[i])
            value.rotateY(rad)
        })
    }
    rotateZ(rad) {
        this.group.forEach((value, index) => {
            this.radZ = rad;
            let value0 = this.relativePos[index];
            this.rotateRelative(index);
            value.position = value.position.map((value, i) => value + this.relativePos[index][i] - value0[i])
            value.rotateZ(rad)
        })
    }
    //计算旋转后改变的世界坐标内的物体的偏移
    rotateRelative(index) {
        let rmodel = glMatrix.mat4.create();
        
        //由于物体是在局部坐标系下旋转的 且按照X-Y-Z进行旋转 这里先求出坐标系的旋转矩阵
        glMatrix.mat4.rotate(rmodel, rmodel, this.radX, [1, 0, 0]);
        glMatrix.mat4.rotate(rmodel, rmodel, this.radY, [0, 1, 0]);
        glMatrix.mat4.rotate(rmodel, rmodel, this.radZ, [0, 0, 1]);
        glMatrix.mat4.invert(rmodel, rmodel) //矩阵求逆
        
        //物体的在整体里的局部坐标是不变的 通过逆变换求出世界坐标内的偏移
        let result0 = glMatrix.vec4.dot(rmodel.slice(0, 4) , [...this.relativePos0[index], 1]);
        let result1 = glMatrix.vec4.dot(rmodel.slice(4, 8) , [...this.relativePos0[index], 1]);
        let result2 = glMatrix.vec4.dot(rmodel.slice(8, 12) , [...this.relativePos0[index], 1]);
        let result3 = glMatrix.vec4.dot(rmodel.slice(12) , [...this.relativePos0[index], 1]);
       
        //更新世界坐标的偏移
        this.relativePos[index] = [result0/result3, result1/result3, result2/result3];
        
    }
}

//将number转换为rgb
function colorRgb(color) {
    let blue = color % (16 * 16) / 255;
    let green = (color >> 8) % (16 * 16) / 255;
    let red = (color >> 16) % (16 * 16) / 255;
    let rgb = [red, green, blue];
    return rgb;
}

//灯光一系列的参数填入着色器中
function setLightColor(shader, color, lightname) {
    if (typeof color == 'object') {
        shader.setValue3(`${lightname}.ambient`, colorRgb(color.ambient));
        shader.setValue3(`${lightname}.diffuse`, colorRgb(color.diffuse));
        shader.setValue3(`${lightname}.specular`, colorRgb(color.specular));
    } else {
        shader.setValue3(`${lightname}.ambient`, colorRgb(color).map(value => value * 0.4));
        shader.setValue3(`${lightname}.diffuse`, colorRgb(color))
        shader.setValue3(`${lightname}.specular`, [1.0, 1.0, 1.0]);
    }
}

function setLightPosition(shader, position, lightname) {
    shader.setValue3(`${lightname}.position`, position);
}

function setLightDirection(shader, direction, lightname) {
    shader.setValue3(`${lightname}.direction`, direction);
}

function setLightParameter(shader, constant, linear, quadratic, lightname) {
    shader.setValue(`${lightname}.constant`, constant);
    shader.setValue(`${lightname}.linear`, linear);
    shader.setValue(`${lightname}.quadratic`, quadratic);
}

function setLightRad(shader, cutOff, outerCutOff) {
    shader.setValue("spotlight.cutOff", cutOff);
    shader.setValue("spotlight.outerCutOff", outerCutOff);
}

//渲染函数
function render(backgroundColor, meshs, camera, lights) {

    let newmeshs = [];

    //group着色需要拆分为单个mesh
    meshs.forEach((ele) => {
        if (ele.constructor.name == "Group") {
            newmeshs.push(...ele.group);
        } else {
            newmeshs.push(ele);
        }
    })

    //由于加载纹理需要异步执行，可能出现绘制之前纹理还没加载好的情况，所以要判读有无纹理再进行渲染
    if (!newmeshs.every(value => value.material.color)) {
        setTimeout(renderMesh.bind(null, backgroundColor, newmeshs, camera, lights), 100);
    } else renderMesh(backgroundColor, newmeshs, camera, lights);

}

//渲染是通过shader对物体进行绘制着色，因此每个物体绑定一个着色器，camera/lights负责提供着色器参数
function renderMesh(backgroundColor, newmeshs, camera, lights) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


    gl.clearColor(...colorRgb(backgroundColor), 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    newmeshs.forEach(mesh => {
        let shader;
        //两种着色器程序，渲染不同材质的物体采用不同的着色器程序
        if (mesh.material.type == "normal") {
            shader = shaderArr[0];
        } else if (mesh.material.type == "light_sensitive") {
            shader = shaderArr[1];
        }

        shader.use();

        //物体坐标变换
        shader.setMatrix4("projection", camera.perspective);
        shader.setMatrix4("view", camera.view);
        shader.setMatrix4("model", mesh.model);

        if (mesh.material.type == "normal") {
            if (mesh.material.color) { //非光照材质且用颜色填充
                let color = colorRgb(mesh.material.color);
                shader.setValuei("chooseColor", 1);
                shader.setValue3("color", color);
            } else {  //非光照材质且用纹理填充
                shader.setValuei("chooseColor", 0);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, mesh.textureID[0]);
                shader.setValuei("texture_normal", 0);
            }
        }
        else if (mesh.material.type == "light_sensitive") {
            let normalMatrix = glMatrix.mat3.create();
            shader.setMatrix3("normalTransform", glMatrix.mat3.normalFromMat4(normalMatrix, mesh.model))

            if (mesh.material.color) {  //光照材质且用颜色填充
                let color = colorRgb(mesh.material.color);
                shader.setValuei("choosematerial", 1);
                shader.setValue3("material1.ambient", color);
                shader.setValue3("material1.diffuse", color);
                shader.setValue3("material1.specular", [1, 1, 1]);
                shader.setValue("material1.shininess", 32);
            }
            else {   //光照材质且用纹理填充
                shader.setValuei("choosematerial", 0)
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, mesh.textureID[0]);
                shader.setValuei("material2.texture_diffuse", 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, mesh.textureID[1]);
                shader.setValuei("material2.texture_specular", 1);

                shader.setValue("material2.shininess", 32);
            }

            //设置光照参数
            shader.setValuei("num1", 0);
            shader.setValuei("num2", 0);
            shader.setValuei("num3", 0);

            lights.forEach(light => {
                if (light.constructor.name == "DirectionLight") {
                    shader.setValuei("num1", 1);
                    shader.setValue3("viewPos", camera.position);
                    setLightColor(shader, light.color, "dirlight");
                    setLightDirection(shader, light.direction, "dirlight");

                } else if (light.constructor.name == "PointLight") {
                    shader.setValuei("num2", 1);
                    shader.setValue3("viewPos", camera.position);
                    setLightColor(shader, light.color, "pointlight");
                    setLightPosition(shader, light.position, "pointlight");
                    setLightParameter(shader, light.constant, light.linear, light.quadratic, "pointlight");
                } else if (light.constructor.name == "SpotLight") {
                    shader.setValuei("num3", 1);
                    shader.setValue3("viewPos", camera.position);
                    setLightColor(shader, light.color, "spotlight");
                    setLightDirection(shader, light.direction, "spotlight");
                    setLightPosition(shader, light.position, "spotlight");
                    setLightRad(shader, light.cutOff, light.outerCutOff);
                    setLightParameter(shader, light.constant, light.linear, light.quadratic, "spotlight");
                }
            })
        }

        //根据不同的物体形状绑定不同的VAO
        if (mesh.type == "box") {
            gl.bindVertexArray(vaoArr[0]);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        } else if (mesh.type == "sphere") {
            gl.bindVertexArray(vaoArr[1]);
            gl.drawElements(gl.TRIANGLES, 9000, gl.UNSIGNED_SHORT, 0);
        } else if (mesh.type == "cylinder") {
            gl.bindVertexArray(vaoArr[2]);
            gl.drawArrays(gl.TRIANGLES, 0, 360);
        }


    })

}

//获取球体的顶点数据
function getSphere(ySegments, xSegments) {
    let vertices = [];
    for (let y = 0; y <= ySegments; y++) {
        for (let x = 0; x <= xSegments; x++) {
            let radA = y / ySegments * Math.PI;
            let radB = x / xSegments * 2 * Math.PI;

            let xPos = 0.5 * Math.sin(radA) * Math.cos(radB);
            let yPos = 0.5 * Math.cos(radA);
            let zPos = 0.5 * Math.sin(radA) * Math.sin(radB);

            vertices.push(xPos);
            vertices.push(yPos);
            vertices.push(zPos);
            vertices.push(2 * xPos);
            vertices.push(2 * yPos);
            vertices.push(2 * zPos);
            vertices.push(x / xSegments);
            vertices.push(y / ySegments);

        }
    }

    let indices = [];
    for (let i = 0; i < ySegments; i++) {
        for (let j = 0; j < xSegments; j++) {
            indices.push(i * (xSegments + 1) + j);
            indices.push((i + 1) * (xSegments + 1) + j);
            indices.push((i + 1) * (xSegments + 1) + j + 1);

            indices.push(i * (xSegments + 1) + j);
            indices.push((i + 1) * (xSegments + 1) + j + 1);
            indices.push(i * (xSegments + 1) + j + 1);
        }
    }

    let buffer = new GeometryBuffer(gl, vertices, indices);
    return buffer.vao;
}

//获取圆柱体的顶点数据
function getCylinder(segments) {
    let verticesT = [];
    let verticesB = [];
    let vertices = [];
    for (let x = 0; x <= segments; x++) {
        let rad = x / segments * 2 * Math.PI;
        let xPos = 0.5 * Math.cos(rad);
        let yPos = 0.5;
        let zPos = 0.5 * Math.sin(rad);

        let vertice = {}
        vertice.x = xPos;
        vertice.y = yPos;
        vertice.z = zPos;

        verticesT.push(vertice);

    }

    for (let x = 0; x <= segments; x++) {
        let rad = x / segments * 2 * Math.PI;
        let xPos = 0.5 * Math.cos(rad);
        let yPos = -0.5;
        let zPos = 0.5 * Math.sin(rad);

        let vertice = {}
        vertice.x = xPos;
        vertice.y = yPos;
        vertice.z = zPos;

        verticesB.push(vertice);

    }

    for (let i = 0; i < segments; i++) {
        vertices.push(0, 0.5, 0);
        vertices.push(0, 1, 0);
        vertices.push(i / segments, 1);

        vertices.push(verticesT[i].x, verticesT[i].y, verticesT[i].z);
        vertices.push(0, 1, 0);
        vertices.push(i / segments, 1);

        vertices.push(verticesT[i + 1].x, verticesT[i + 1].y, verticesT[i + 1].z);
        vertices.push(0, 1, 0);
        vertices.push((i + 1) / segments, 1);
    }

    for (let i = 0; i < segments; i++) {
        vertices.push(0, -0.5, 0);
        vertices.push(0, -1, 0);
        vertices.push(i / segments, 0);

        vertices.push(verticesB[i].x, verticesB[i].y, verticesB[i].z);
        vertices.push(0, -1, 0);
        vertices.push(i / segments, 0);

        vertices.push(verticesB[i + 1].x, verticesB[i + 1].y, verticesB[i + 1].z);
        vertices.push(0, -1, 0);
        vertices.push((i + 1) / segments, 0);
    }

    for (let i = 0; i < segments; i++) {

        vertices.push(verticesT[i].x, verticesT[i].y, verticesT[i].z);
        vertices.push(2 * verticesT[i].x, 0, 2 * verticesT[i].z);
        vertices.push(i / segments, 1);

        vertices.push(verticesB[i].x, verticesB[i].y, verticesB[i].z);
        vertices.push(2 * verticesB[i].x, 0, 2 * verticesB[i].z);
        vertices.push(i / segments, 0);

        vertices.push(verticesB[i + 1].x, verticesB[i + 1].y, verticesB[i + 1].z);
        vertices.push(2 * verticesB[i + 1].x, 0, 2 * verticesB[i + 1].z);
        vertices.push((i + 1) / segments, 0);

        vertices.push(verticesT[i].x, verticesT[i].y, verticesT[i].z);
        vertices.push(2 * verticesT[i].x, 0, 2 * verticesT[i].z);
        vertices.push(i / segments, 1);

        vertices.push(verticesT[i + 1].x, verticesT[i + 1].y, verticesT[i + 1].z);
        vertices.push(2 * verticesT[i + 1].x, 0, 2 * verticesT[i + 1].z);
        vertices.push((i + 1) / segments, 1);

        vertices.push(verticesB[i + 1].x, verticesB[i + 1].y, verticesB[i + 1].z);
        vertices.push(2 * verticesB[i + 1].x, 0, 2 * verticesB[i + 1].z);
        vertices.push((i + 1) / segments, 0);
    }

    let indices = 0;

    let buffer = new GeometryBuffer(gl, vertices, indices);

    return buffer.vao;

}

//获取立方体的顶点数据
function getBox() {
    let vertices = [
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,

        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,

        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,

        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,

        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0
    ]
    let indices = 0;

    let buffer = new GeometryBuffer(gl, vertices, indices);

    return buffer.vao;

}

//初始化时创建不同的着色程序
function createShaderArr() {
    shaderArr.push(new Shader(gl, vShader1, fShader1));
    shaderArr.push(new Shader(gl, vShader2, fShader2));
}

//初始化时创建不同的VAO
function createVaoArr() {

    vaoArr.push(getBox());
    vaoArr.push(getSphere(30, 50));
    vaoArr.push(getCylinder(30));

}

//初始化，需要获取gl对象
function init(glInit) {
    gl = glInit;
    createShaderArr();
    createVaoArr();

}

export { Mesh, Group, Camera, DirectionLight, PointLight, SpotLight, render, init };