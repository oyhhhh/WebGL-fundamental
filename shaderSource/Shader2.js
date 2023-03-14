const vShader =`#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalTransform;

out vec3 fragPos;
out vec3 normal;
out vec2 texCoord;

void main()
{
    mat4 transform = projection * view * model;
	gl_Position = transform * vec4(aPos, 1.0);

	normal = normalTransform * aNormal;
	texCoord = aTexCoord;
    fragPos = vec3(model * vec4(aPos, 1.0)); //在世界坐标中计算
	
}
`;

const fShader =`#version 300 es
precision mediump float;

struct Material1 
{
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
}; 

struct Material2
{
    sampler2D texture_diffuse;
    sampler2D texture_specular;
    float shininess;
};

struct DirLight 
{
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct PointLight {
    vec3 position;
    
    float constant;
    float linear;
    float quadratic;
	
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

struct SpotLight {
    vec3 position;
    vec3 direction;
    float cutOff;
    float outerCutOff;
  
    float constant;
    float linear;
    float quadratic;
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;       
};

in vec3 normal;
in vec2 texCoord;
in vec3 fragPos;

uniform Material1 material1;
uniform Material2 material2;
uniform bool choosematerial;
uniform DirLight dirlight;
uniform PointLight pointlight;
uniform SpotLight spotlight;
uniform bool num1;
uniform bool num2;
uniform bool num3;
uniform vec3 viewPos;

out vec4 FragColor;

vec3 calcDirLight(DirLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir);
vec3 calcPointLight(PointLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir);
vec3 calcSpotLight(SpotLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir);

void main()
{
    vec3 ambientColor = choosematerial? material1.ambient : texture(material2.texture_diffuse, texCoord).rgb;
    vec3 diffuseColor = choosematerial? material1.diffuse : texture(material2.texture_diffuse, texCoord).rgb;
    vec3 specularColor = choosematerial? material1.specular : texture(material2.texture_specular, texCoord).rgb;
    float shininess = choosematerial? material1.shininess : material2.shininess;

    vec3 norm = normalize(normal);
    vec3 viewDir = normalize(viewPos - fragPos);
   
    vec3 color = vec3(0.0, 0.0, 0.0);
    if(num1) {
        color += calcDirLight(dirlight, ambientColor, diffuseColor, specularColor, shininess, norm, viewDir);
    }
    if(num2) {
        color += calcPointLight(pointlight, ambientColor, diffuseColor, specularColor, shininess, norm, viewDir);
    }
    if(num3) {
        color +=calcSpotLight(spotlight, ambientColor, diffuseColor, specularColor, shininess, norm, viewDir);
    }

    FragColor = vec4(color, 1.0);
}

vec3 calcDirLight(DirLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir)
{
    vec3 ambientLight = light.ambient * ambientColor;

    vec3 lightDir = normalize(-light.direction);
    float diff = max(dot(lightDir, norm), 0.0);
    vec3 diffuseLight = diff * light.diffuse * diffuseColor;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), shininess); //Blinn-Phong模型
    vec3 specularLight = spec * light.specular * specularColor;

    return ambientLight + diffuseLight + specularLight;
}

vec3 calcPointLight(PointLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir)
{
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    
    vec3 ambientLight = light.ambient * ambientColor * attenuation;

    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(lightDir, norm), 0.0);
    vec3 diffuseLight = diff * light.diffuse * diffuseColor * attenuation;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), shininess); //Blinn-Phong模型
    vec3 specularLight = spec * light.specular * specularColor * attenuation;

    return ambientLight + diffuseLight + specularLight;
}

vec3 calcSpotLight(SpotLight light, vec3 ambientColor, vec3 diffuseColor, vec3 specularColor, float shininess, vec3 norm, vec3 viewDir)
{
    float distance = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

    vec3 lightDir = normalize(light.position - fragPos);

    float theta = dot(lightDir, normalize(-light.direction));
    float epsilon = light.cutOff - light.outerCutOff;
    float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);

    vec3 ambientLight = light.ambient * ambientColor * intensity * attenuation;

    float diff = max(dot(lightDir, norm), 0.0);
    vec3 diffuseLight = diff * light.diffuse * diffuseColor * intensity * attenuation;

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0), shininess); //Blinn-Phong模型
    vec3 specularLight = spec * light.specular * specularColor * intensity * attenuation;

    return ambientLight + diffuseLight + specularLight;
}

`;

export {vShader, fShader};