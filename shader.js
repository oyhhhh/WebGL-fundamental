class Shader {
    constructor(gl, vShader, fShader) {
        this.id = this.programCreate(gl, vShader, fShader);
        this.gl = gl;
    }
    shaderCreate(gl, type, source) {
        let shader;
        if(type == "vShader") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } 
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(success) {
            return shader;
        }

        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    programCreate(gl, vShader, fShader) {
        let program = gl.createProgram();

        let vertextShader = this.shaderCreate(gl, "vShader", vShader);
        let fragmentShader = this.shaderCreate(gl, "fShader", fShader);
        gl.attachShader(program, vertextShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(success) {
            return program;
        }

        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);

    }
    use() {
        this.gl.useProgram(this.id);
    }
    setValuei(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.id, name), value);
    }
    setValue(name, value) {
        this.gl.uniform1f(this.gl.getUniformLocation(this.id, name), value);
    }
    setValue3(name, value) {
        this.gl.uniform3fv(this.gl.getUniformLocation(this.id, name), value);
    }
    setMatrix4(name, value) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.id, name), false, value);
    }
    setMatrix3(name, value) {
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.id, name), false, value);
    }
    deleteShader() {
        this.gl.deleteProgram(this.id);
    }
}

export {Shader};