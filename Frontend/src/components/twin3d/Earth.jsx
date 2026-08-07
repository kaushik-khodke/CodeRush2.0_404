import { useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// High-resolution NASA Earth texture URLs
const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_BUMP_URL = "https://unpkg.com/three-globe/example/img/earth-topology.png";

export default function Earth() {
  const earthRef = useRef();
  const atmosphereRef = useRef();

  // Load NASA Earth Texture Maps safely
  const [texture, bumpMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_URL,
    EARTH_BUMP_URL,
  ]);

  useFrame((_state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.03 * delta;
    }
  });

  // Custom Shader Material for realistic outer atmospheric glow
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.12, 0.74, 0.95, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
  }, []);

  return (
    <group ref={earthRef}>
      {/* High-Resolution Textured Earth Globe */}
      <mesh>
        <sphereGeometry args={[1.49, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={bumpMap}
          bumpScale={0.05}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* Futuristic Holographic Coordinate Grid Overlay */}
      <mesh>
        <sphereGeometry args={[1.502, 36, 36]} />
        <meshStandardMaterial
          color="#00f0ff"
          wireframe
          transparent
          opacity={0.12}
          roughness={0.3}
        />
      </mesh>

      {/* Glowing Outer Atmosphere Shell */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.58, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Equatorial Orbit Ring Reference */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.51, 1.52, 128]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
