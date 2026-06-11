import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./Map3D.css";

const Map3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // ==================== SCENE ====================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1f2e);
    scene.fog = new THREE.Fog(0x1a1f2e, 150, 300);

    // ==================== CAMERA ====================
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    camera.lookAt(0, 0, 0);

    // ==================== RENDERER ====================
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x1a1f2e, 1);
    currentMount.appendChild(renderer.domElement);

    // ==================== CONTROLS ====================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minDistance = 40;
    controls.maxDistance = 180;

    // ==================== LIGHTING ====================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 250;
    scene.add(sunLight);

    // ==================== GROUND ====================
    const groundGeometry = new THREE.PlaneGeometry(220, 220);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5f6f,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;
    scene.add(ground);

    // ==================== ROADS ====================
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0,
    });

    const road1 = new THREE.Mesh(new THREE.BoxGeometry(220, 0.2, 18), roadMaterial);
    road1.position.y = 0.1;
    road1.castShadow = true;
    road1.receiveShadow = true;
    scene.add(road1);

    const road2 = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 220), roadMaterial);
    road2.position.y = 0.1;
    road2.castShadow = true;
    road2.receiveShadow = true;
    scene.add(road2);

    // ==================== ROAD MARKINGS ====================
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });

    for (let i = -100; i <= 100; i += 12) {
      const line1 = new THREE.Mesh(new THREE.BoxGeometry(9, 0.05, 0.7), lineMaterial);
      line1.position.set(i, 0.15, 0);
      scene.add(line1);

      const line2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 9), lineMaterial);
      line2.position.set(0, 0.15, i);
      scene.add(line2);
    }

    // ==================== BUILDINGS (procedural) ====================
    const buildingColors = [0x7b9fc4, 0x6b8fb5, 0x5b7fa6, 0x8bafd6];

    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    for (let i = 0; i < 90; i++) {
      const width = Math.random() * 4 + 4;
      const depth = Math.random() * 4 + 4;
      const height = Math.random() * 35 + 12;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
        roughness: 0.72,
        metalness: 0.25,
      });

      const building = new THREE.Mesh(geometry, material);
      let x = (Math.random() - 0.5) * 170;
      let z = (Math.random() - 0.5) * 170;

      // Avoid roads (center cross)
      if (Math.abs(x) < 16 || Math.abs(z) < 16) {
        x += 32;
        z += 32;
      }

      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      cityGroup.add(building);

      // Roofs
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(width / 1.35, 4, 8),
        new THREE.MeshStandardMaterial({
          color: 0x2c3e50,
          roughness: 0.85,
        })
      );
      roof.position.set(x, height + 2, z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      cityGroup.add(roof);

      // Building light
      const light = new THREE.PointLight(0x00d4ff, 0.55, 35);
      light.position.set(x, height + 3, z);
      cityGroup.add(light);
    }

    // ==================== TREES ====================
    for (let i = 0; i < 70; i++) {
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(2.6, 7.2, 9),
        new THREE.MeshStandardMaterial({
          color: 0x2d5016,
          roughness: 0.85,
        })
      );

      tree.position.set(
        (Math.random() - 0.5) * 160,
        3,
        (Math.random() - 0.5) * 160
      );

      tree.castShadow = true;
      tree.receiveShadow = true;
      scene.add(tree);
    }

    // ==================== GRID ====================
    const gridHelper = new THREE.GridHelper(220, 55, 0x444444, 0x222222);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // ==================== ANIMATION ====================
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ==================== RESIZE ====================
    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // ==================== CLEANUP ====================
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      controls.dispose();

      // Dispose geometries/materials (best-effort)
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
          else obj.material.dispose?.();
        }
      });

      renderer.dispose();
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="map3d-root" aria-label="Interactive 3D city view">
      <div className="map3d-container" ref={mountRef} />
    </div>
  );
};

export default Map3D;

