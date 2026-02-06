import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ShowreelImage, HandData } from "../types";

interface Props {
  images: ShowreelImage[];
  handData: HandData;
}

type DrawableSource = CanvasImageSource & {
  width: number;
  height: number;
};

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const createRoundedImageTexture = (
  source: DrawableSource,
): { texture: THREE.CanvasTexture; width: number; height: number } | null => {
  const maxDimension = 1024;
  const scale = Math.min(
    1,
    maxDimension / Math.max(source.width || 1, source.height || 1),
  );
  const width = Math.max(8, Math.round(source.width * scale));
  const height = Math.max(8, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const radius = Math.max(8, Math.round(Math.min(width, height) * 0.08));
  drawRoundedRectPath(ctx, 0, 0, width, height, radius);
  ctx.clip();
  ctx.drawImage(source, 0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return { texture, width, height };
};

const createFrameTexture = (
  width: number,
  height: number,
  padding: number,
): THREE.CanvasTexture | null => {
  const frameWidth = Math.max(12, Math.round(width + padding * 2));
  const frameHeight = Math.max(12, Math.round(height + padding * 2));
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth;
  canvas.height = frameHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const radius = Math.max(10, Math.round(Math.min(frameWidth, frameHeight) * 0.1));
  const lineWidth = Math.max(2, Math.round(Math.min(frameWidth, frameHeight) * 0.02));
  const offset = lineWidth / 2;

  drawRoundedRectPath(
    ctx,
    offset,
    offset,
    frameWidth - lineWidth,
    frameHeight - lineWidth,
    radius,
  );
  ctx.fillStyle = "rgba(255, 249, 251, 0.98)";
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "rgba(230, 171, 191, 0.9)";
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return texture;
};

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
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              const texturedMat = mat as THREE.MeshBasicMaterial;
              if (texturedMat.map) texturedMat.map.dispose();
              mat.dispose();
            });
          } else {
            const texturedMat = object.material as THREE.MeshBasicMaterial;
            if (texturedMat.map) texturedMat.map.dispose();
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    }

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0xfbecee, 0.00038);

    const camera = new THREE.PerspectiveCamera(
      48,
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();

    const count = images.length;

    // Geometry Constants
    const isMobile = window.innerWidth < 768;
    const radius = isMobile ? 840 : 1140;
    const imgWidth = isMobile ? 300 : 410;
    const imgHeight = isMobile ? 225 : 300;
    const framePadding = isMobile ? 10 : 12;
    const frameTexturePadding = isMobile ? 14 : 16;

    images.forEach((img, i) => {
      // Cylindrical Carousel Logic
      const angle = (i / count) * Math.PI * 2;

      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = Math.sin(angle * 4) * 210;

      const frameMaterial = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        color: 0xffffff,
      });

      const material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        color: 0xffffff,
      });

      const frameGeometry = new THREE.PlaneGeometry(
        imgWidth + framePadding * 2,
        imgHeight + framePadding * 2,
      );
      const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
      frameMesh.position.z = -1.2;

      const geometry = new THREE.PlaneGeometry(imgWidth, imgHeight);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.8;

      const cardGroup = new THREE.Group();
      cardGroup.add(frameMesh);
      cardGroup.add(mesh);

      // Load texture with error handling
      textureLoader.load(
        img.url,
        (texture) => {
          const imageSource = texture.image as DrawableSource | undefined;
          const hasDimensions =
            imageSource &&
            typeof imageSource.width === "number" &&
            typeof imageSource.height === "number" &&
            imageSource.width > 0 &&
            imageSource.height > 0;

          if (hasDimensions) {
            const rounded = createRoundedImageTexture(imageSource);
            if (rounded) {
              material.map = rounded.texture;
              material.needsUpdate = true;

              const frameTexture = createFrameTexture(
                rounded.width,
                rounded.height,
                frameTexturePadding,
              );
              if (frameTexture) {
                frameMaterial.map = frameTexture;
                frameMaterial.needsUpdate = true;
              }
            } else {
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.minFilter = THREE.LinearFilter;
              material.map = texture;
              material.needsUpdate = true;
            }

            const imageAspectRatio = imageSource.width / imageSource.height;
            const maxWidth = imgWidth;
            const maxHeight = imgHeight;

            let newWidth = maxWidth;
            let newHeight = maxWidth / imageAspectRatio;

            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = maxHeight * imageAspectRatio;
            }

            geometry.scale(newWidth / maxWidth, newHeight / maxHeight, 1);
            frameGeometry.scale(
              (newWidth + framePadding * 2) / (imgWidth + framePadding * 2),
              (newHeight + framePadding * 2) / (imgHeight + framePadding * 2),
              1,
            );
          } else {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            material.map = texture;
            material.needsUpdate = true;
          }

          if (material.map !== texture) {
            texture.dispose();
          }
        },
        undefined,
        (err) => {
          console.error(`Failed to load texture: ${img.url}`, err);
          material.map = null;
          material.color.set(0xffd6de);
          material.needsUpdate = true;
          frameMaterial.map = null;
          frameMaterial.color.set(0xfff5f8);
          frameMaterial.needsUpdate = true;
        },
      );

      cardGroup.position.set(x, y, z);
      cardGroup.lookAt(x * 2, y, z * 2);

      group.add(cardGroup);
    });

    scene.add(new THREE.AmbientLight(0xffffff, 2.4));

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
      group.rotation.x = 0.03 + Math.sin(elapsedTime * 0.4) * 0.02;
      group.position.y = Math.sin(elapsedTime * 0.6) * 16;

      const zoomSpeed = 1.0 - Math.pow(0.001, delta);
      camera.position.z +=
        (state.current.targetZoom - camera.position.z) * zoomSpeed;

      const isHeart = handData.isTwoHandHeartDetected;
      const pulseSpeed = isHeart ? 7.2 : 0.8;
      const targetScale = isHeart ? 1.1 : 1.0;
      const pulse =
        targetScale +
        Math.sin(elapsedTime * pulseSpeed) * (isHeart ? 0.05 : 0.004);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, pulse, 0.09));

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
