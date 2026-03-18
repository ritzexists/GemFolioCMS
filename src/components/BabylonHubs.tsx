import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PointLight,
  ActionManager,
  ExecuteCodeAction,
  DynamicTexture,
  Mesh,
  GlowLayer
} from '@babylonjs/core';

interface HubItem {
  title: string;
  image: string;
  link: string;
  status: string;
}

interface BabylonHubsProps {
  items: HubItem[];
}

export default function BabylonHubs({ items }: BabylonHubsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current || theme === 'paper') return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color3(0.03, 0.03, 0.04).toColor4();

    // Camera
    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 20, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 100;
    camera.useAutoRotationBehavior = true;
    if (camera.autoRotationBehavior) {
      camera.autoRotationBehavior.idleRotationSpeed = 0.1;
      camera.autoRotationBehavior.idleRotationWaitTime = 1000;
      camera.autoRotationBehavior.idleRotationSpinupTime = 2000;
    }

    // Lights
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const pinkLight = new PointLight("pinkLight", new Vector3(5, 5, 5), scene);
    pinkLight.diffuse = new Color3(0.85, 0.27, 0.94); // neon pink
    pinkLight.intensity = 0.5;

    // Glow Layer for neon effect
    const glow = new GlowLayer("glow", scene);
    glow.intensity = 0.8;

    // Grid Floor (Tron style)
    const gridGround = MeshBuilder.CreateGround("gridGround", { width: 100, height: 100 }, scene);
    const gridMat = new StandardMaterial("gridMat", scene);
    gridMat.diffuseColor = new Color3(0, 0, 0);
    gridMat.specularColor = new Color3(0, 0, 0);
    gridMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
    
    // Create a procedural grid texture using DynamicTexture
    const gridTexture = new DynamicTexture("gridTexture", 512, scene, true);
    const ctx = gridTexture.getContext();
    ctx.strokeStyle = "#d946ef"; // neon pink
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 32) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
    }
    ctx.stroke();
    gridTexture.update();
    
    gridMat.opacityTexture = gridTexture;
    gridMat.emissiveColor = new Color3(0.85, 0.27, 0.94);
    gridGround.material = gridMat;
    gridGround.position.y = -5;

    // Nodes
    items.forEach((item, index) => {
      const angle = (index / items.length) * Math.PI * 2;
      const radius = 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(index) * 2;

      // Node Geometry
      const node = MeshBuilder.CreatePolyhedron("node_" + index, { type: 1, size: 1.2 }, scene);
      node.position = new Vector3(x, y, z);

      const nodeMat = new StandardMaterial("nodeMat_" + index, scene);
      const isOnline = item.status === 'Online';
      const nodeColor = isOnline ? new Color3(0.64, 0.9, 0.2) : new Color3(0.94, 0.27, 0.27);
      
      nodeMat.diffuseColor = nodeColor;
      nodeMat.emissiveColor = nodeColor;
      nodeMat.wireframe = true;
      node.material = nodeMat;

      // Inner Core
      const core = MeshBuilder.CreateSphere("core_" + index, { diameter: 0.4 }, scene);
      core.parent = node;
      const coreMat = new StandardMaterial("coreMat_" + index, scene);
      coreMat.emissiveColor = new Color3(1, 1, 1);
      core.material = coreMat;

      // Label
      const labelPlane = MeshBuilder.CreatePlane("label_" + index, { width: 4, height: 1 }, scene);
      labelPlane.position = new Vector3(x, y + 2.5, z);
      labelPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;

      const labelTexture = new DynamicTexture("labelTex_" + index, { width: 256, height: 64 }, scene);
      labelTexture.hasAlpha = true;
      labelTexture.drawText(item.title.toUpperCase(), null, null, "bold 32px monospace", "#a3e635", "transparent", true);
      
      const labelMat = new StandardMaterial("labelMat_" + index, scene);
      labelMat.diffuseTexture = labelTexture;
      labelMat.opacityTexture = labelTexture;
      labelMat.emissiveColor = new Color3(1, 1, 1);
      labelMat.backFaceCulling = false;
      labelPlane.material = labelMat;

      // Interaction
      node.actionManager = new ActionManager(scene);
      node.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        node.scaling = new Vector3(1.2, 1.2, 1.2);
        nodeMat.emissiveColor = nodeColor.scale(2);
      }));
      node.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        node.scaling = new Vector3(1, 1, 1);
        nodeMat.emissiveColor = nodeColor;
      }));
      node.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        window.open(item.link, '_blank');
      }));
    });

    // Background Particles
    const particleCount = 200;
    const points = [];
    for (let i = 0; i < particleCount; i++) {
        points.push(new Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60));
    }
    
    points.forEach((p, i) => {
        const dot = MeshBuilder.CreateSphere("dot_" + i, { diameter: 0.05 }, scene);
        dot.position = p;
        const dotMat = new StandardMaterial("dotMat_" + i, scene);
        dotMat.emissiveColor = new Color3(0.85, 0.27, 0.94);
        dot.material = dotMat;
    });

    // Animation
    scene.registerBeforeRender(() => {
        const time = performance.now() * 0.001;
        scene.meshes.forEach(mesh => {
            if (mesh.name.startsWith("node_")) {
                mesh.rotation.y += 0.01;
                mesh.rotation.x += 0.005;
                const idx = parseInt(mesh.name.split("_")[1]);
                mesh.position.y = Math.sin(time + idx) * 0.5;
            }
        });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [items]);

  if (theme === 'paper') {
    return (
      <div className="space-y-4 p-6 border border-black">
        <h2 className="text-xl font-bold uppercase mb-4">VR Portals (Simplified List)</h2>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between p-3 border border-black hover:bg-black hover:text-white transition-colors">
              <div className="flex flex-col">
                <span className="font-bold uppercase">{item.title}</span>
                <span className="text-xs opacity-70">Status: {item.status}</span>
              </div>
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-1 border border-black hover:bg-white hover:text-black transition-colors text-xs font-bold uppercase"
              >
                Enter Portal
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 relative overflow-hidden bg-void">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full outline-none touch-none"
      />
      
      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-neon-pink text-void px-2 py-1 font-black text-xs uppercase mb-1 animate-pulse">
          SYSTEM: HUBS_CORE_v4.0
        </div>
        <div className="bg-void border border-neon-green text-neon-green px-2 py-1 font-mono text-[10px] uppercase">
          KERNEL: BABYLON_ENGINE_ACTIVE
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 pointer-events-none text-right">
        <div className="text-neon-pink font-mono text-[10px] uppercase opacity-50">
          SEC_LEVEL: ALPHA_7
        </div>
        <div className="text-neon-green font-mono text-[10px] uppercase opacity-50">
          ENCRYPTION: RSA_4096
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="text-white/30 font-mono text-[8px] uppercase leading-tight">
          [TRACE_ROUTE_INITIATED]<br/>
          [PACKET_LOSS: 0.00%]<br/>
          [LATENCY: 12ms]
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none border-2 border-neon-pink/10 mix-blend-overlay"></div>
    </div>
  );
}
