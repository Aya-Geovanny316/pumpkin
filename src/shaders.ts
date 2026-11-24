export const petalVertex = `
  uniform float uGrowth;
  uniform float uTime;
  uniform float uBreeze;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 displaced = position;
    float height = clamp(position.y, 0.0, 1.0);
    displaced.x += sin(uTime * 0.8 + position.y * 2.1) * uBreeze * 0.018 * height;
    displaced.z += cos(uTime * 0.7 + position.x * 3.0) * uBreeze * 0.012 * height;
    displaced *= uGrowth;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = world.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const organicFragment = `
  uniform vec3 uColor;
  uniform vec3 uShadow;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 lightDir = normalize(vec3(-0.45, 0.9, 0.65));
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
    float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.4);
    float warm = 0.035 * sin(uTime * 0.35 + vWorldPosition.y * 2.0);
    vec3 color = mix(uShadow, uColor, smoothstep(0.02, 0.72, diffuse));
    color *= 1.18 + diffuse * 0.42;
    color += rim * uColor * 0.32 + warm;
    gl_FragColor = vec4(color, 1.0);
  }
`;
