const vShader =`#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

out vec2 texCoord;

void main()
{
    mat4 transform = projection * view * model;
	gl_Position = transform * vec4(aPos, 1.0);

	texCoord = vec2(aTexCoord.x, aTexCoord.y);
}
`;

const fShader =`#version 300 es
precision mediump float;

in vec2 texCoord;

uniform sampler2D texture_normal;
uniform vec3 color;
uniform bool chooseColor;

out vec4 FragColor;

void main()
{
    FragColor = chooseColor? vec4(color, 1.0) : texture(texture_normal, texCoord);
}

`;

export {vShader, fShader};