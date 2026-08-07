import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Satellite from './Satellite.jsx';

export default function Scene({
  selectedSubsystem,
  setSelectedSubsystem,
  panelBStatus,
  batteryStatus,
}) {
  return (
    <div style={{ width: '100%', height: '200px', background: 'rgba(5, 7, 10, 0.4)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [3, 2.5, 4.5], fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]} // Cap device pixel ratio for performance
      >
        {/* Space lighting */}
        <ambientLight intensity={0.4} />
        
        {/* High contrast directional light to simulate solar rays */}
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Soft fill light */}
        <pointLight position={[-5, -3, -5]} intensity={0.5} />

        <Satellite
          selectedSubsystem={selectedSubsystem}
          setSelectedSubsystem={setSelectedSubsystem}
          panelBStatus={panelBStatus}
          batteryStatus={batteryStatus}
        />

        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minDistance={2.5} 
          maxDistance={7}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
