import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ShowreelImage, HandData } from "../types";

interface Props {
  images: ShowreelImage[];
  handData: HandData;
}

const SpatialScene: React.FC<Props> = ({ images, handData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group;
    clock: THREE.Clock;
  } | null>(null);

  const state = useRef({
    rotationX: 0,
    rotationY: 0,
    velX: 0,
    velY: 0,
    targetZoom: window.innerWidth < 768 ? 2400 : 2000,
    lastHandX: 0.5,
    lastHandY: 0.5,
    isFirstFrame: true,
    isMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup previous instance completely
    containerRef.current.innerHTML = "";
    if (sceneRef.current) {
      const { renderer, group } = sceneRef.current;
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      renderer.dispose();
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff1f2);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      1,
      8000,
    );
    camera.position.z = state.current.targetZoom;

    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: "high-performance",
    });

    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();

    const count = images.length;

    // Geometry Constants
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 900 : 1200;
    const imgWidth = isMobile ? 320 : 420;
    const imgHeight = isMobile ? 240 : 315;

    images.forEach((img, i) => {
      // Cylindrical Carousel Logic
      const angle = (i / count) * Math.PI * 2;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = Math.sin(angle * 4) * 250;

      // Create material first with white color
      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        color: 0xffffff,
      });

      // Create a default placeholder mesh (will be updated when texture loads)
      const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
      const mesh = new THREE.Mesh(geometry, material);

      // Load texture with error handling
      textureLoader.load(
        img.url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          material.map = texture;
          material.needsUpdate = true;

          // Adjust geometry to maintain aspect ratio
          const imageAspectRatio = texture.image.width / texture.image.height;
          const maxWidth = imgWidth;
          const maxHeight = imgHeight;

          let newWidth = maxWidth;
          let newHeight = maxWidth / imageAspectRatio;

          // If height exceeds max, scale down from height instead
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = maxHeight * imageAspectRatio;
          }

          geometry.scale(newWidth / maxWidth, newHeight / maxHeight, 1);
        },
        undefined,
        (err) => {
          console.error(`Failed to load texture: ${img.url}`, err);
          // Fallback visualization if image fails
          material.map = null;
          material.color.set(0xffccd5); // Rose pink fallback
          material.needsUpdate = true;
        },
      );

      mesh.position.set(x, y, z);
      mesh.lookAt(x * 2, y, z * 2);

      group.add(mesh);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 2.5));

    const clock = new THREE.Clock();
    sceneRef.current = { scene, camera, renderer, group, clock };

    // Unified Interaction (Mouse + Touch)
    const handleStart = (clientX: number, clientY: number) => {
      state.current.isMouseDown = true;
      state.current.lastMouseX = clientX;
      state.current.lastMouseY = clientY;
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!state.current.isMouseDown) return;
      const dx = (clientX - state.current.lastMouseX) / window.innerWidth;
      state.current.velY += dx * 0.15;
      state.current.lastMouseX = clientX;
      state.current.lastMouseY = clientY;
    };

    const onMouseDown = (e: MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) =>
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) =>
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onEnd = () => {
      state.current.isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.current.targetZoom = THREE.MathUtils.clamp(
        state.current.targetZoom + e.deltaY * 2.0,
        200,
        4500,
      );
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("wheel", onWheel, { passive: false });

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;

      const { camera, renderer, scene, group, clock } = sceneRef.current;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      const damping = Math.pow(0.92, delta * 60);
      state.current.velY *= damping;

      state.current.rotationY += state.current.velY;

      group.rotation.y = state.current.rotationY;
      group.rotation.x = 0;

      const zoomSpeed = 1.0 - Math.pow(0.001, delta);
      camera.position.z +=
        (state.current.targetZoom - camera.position.z) * zoomSpeed;

      const isHeart = handData.isTwoHandHeartDetected;
      const pulseSpeed = isHeart ? 8.0 : 1.0;
      const targetScale = isHeart ? 1.1 : 1.0;
      const pulse =
        targetScale +
        Math.sin(elapsedTime * pulseSpeed) * (isHeart ? 0.05 : 0.005);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, pulse, 0.1));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [images]);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (handData.isVisible) {
      if (state.current.isFirstFrame) {
        state.current.lastHandX = handData.x;
        state.current.lastHandY = handData.y;
        state.current.isFirstFrame = false;
      } else {
        const dx = handData.x - state.current.lastHandX;
        state.current.velY += dx * 0.15;
        state.current.lastHandX = handData.x;
        state.current.lastHandY = handData.y;
      }
    } else {
      state.current.isFirstFrame = true;
    }
  }, [handData]);

  return <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />;
};

export default SpatialScene;
