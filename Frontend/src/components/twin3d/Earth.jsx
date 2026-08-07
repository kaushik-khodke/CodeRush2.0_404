import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function Earth() {
  const earthRef = useRef();

  useFrame((state, delta) => {
    if (earthRef.current) {
      // Slow rotation for ambient feel
      earthRef.current.rotation.y += 0.02 * delta;
    }
  });

  return (
    <group ref={earthRef}>
      {/* Solid dark base sphere to hide backside elements */}
      <mesh>
        <sphereGeometry args={[1.49, 32, 32]} />
        <meshStandardMaterial color="#05080f" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Wireframe outer sphere for high-tech digital twin styling */}
      <mesh>
        <sphereGeometry args={[1.5, 30, 30]} />
        <meshStandardMaterial
          color="#1f6f78"
          wireframe
          transparent
          opacity={0.35}
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>

      {/* Equatorial reference line */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.505, 1.515, 64]} />
        <meshBasicMaterial color="#1f6f78" transparent opacity={0.6} side={2} />
      </mesh>
    </group>
  );
}
