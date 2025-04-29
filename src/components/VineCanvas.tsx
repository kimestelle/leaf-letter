import { useEffect, useRef, useState } from "react";

type Leaf = {
  x: number;
  y: number;
  life: number;
  width: number;
  height: number;
  angle: number;
};

type Point = {
    x: number;
    y: number;
    life: number;
    leaves?: Leaf[];
    letters?: Letter[];
};  

type Letter = {
    x: number;
    y: number;
    char: string;
    life: number;
    size: number;
    angle: number;
  };
  

export default function VineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const leafImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  const [isMouseMoving, setIsMouseMoving] = useState(false);

  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const smoothXRef = useRef(0);
  const smoothYRef = useRef(0);
  const smoothing = 0.1;
  const leafGenerationThreshold = 0.03;
  const letterGenerationThreshold = 0.03;

  const generateLetters = (x: number, y: number): Letter | null => {
    if (Math.random() < letterGenerationThreshold) {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const char = chars[Math.floor(Math.random() * chars.length)];
      return {
        x,
        y,
        char,
        life: 1.0,
        size: 16 + Math.random() * 12,
        angle: Math.random() * Math.PI * 2,
      };
    }
    return null;
  };  

  const generateLeaves = (x: number, y: number): Leaf | null => {
    if (Math.random() < leafGenerationThreshold) {
      const width = 10 + Math.random() * 7;
      const height = width * 1.5;
      return {
        x: x,
        y: y,
        life: 1.0,
        width,
        height,
        angle: Math.random() * 360,
      };
    }
    return null;
  };

  useEffect(() => {
    const leafImage = new Image();
    leafImage.src = "/leaf.svg";
    leafImage.onload = () => {
      leafImageRef.current = leafImage;
    };

    const backgroundImage = new Image();
    backgroundImage.src = "/cream-paper.png";
    backgroundImage.onload = () => {
      backgroundImageRef.current = backgroundImage;
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      targetXRef.current = e.clientX;
      targetYRef.current = e.clientY;
      setIsMouseMoving(true);
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      if (!ctx || !isMouseMoving) return;

      ctx.fillStyle = '#eee9e0'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (backgroundImageRef.current) {
        const pattern = ctx.createPattern(backgroundImageRef.current, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1.0;
        }
      }

      const time = Date.now() * 0.001;

      smoothXRef.current += (targetXRef.current - smoothXRef.current) * smoothing;
      smoothYRef.current += (targetYRef.current - smoothYRef.current) * smoothing;

      //wave offset for loops
      const randomWiggleStrength = 30;
      const offsetX = Math.sin(time * 10.0) * randomWiggleStrength;
      const offsetY = Math.cos(time * 10.0) * randomWiggleStrength;
      const wigglyX = smoothXRef.current + offsetX;
      const wigglyY = smoothYRef.current + offsetY;

      const newLeaf = generateLeaves(wigglyX, wigglyY);
      const newLetter = generateLetters(wigglyX, wigglyY);
        const newPoint: Point = {
        x: wigglyX,
        y: wigglyY,
        life: 1.0,
        leaves: newLeaf ? [newLeaf] : [],
        letters: newLetter ? [newLetter] : [],
        };

      pointsRef.current.push(newPoint);

      pointsRef.current.push(newPoint);

      const points = pointsRef.current;

      //blend into background texture
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];

        const opacity = Math.min(p0.life, p1.life);
        const startColor = { r: 0, g: 107, b: 0 };
        const endColor = { r: 90, g: 100, b: 50 };

        const r = startColor.r + (1.5 - opacity) * (endColor.r - startColor.r);
        const g = startColor.g + (1.5 - opacity) * (endColor.g - startColor.g);
        const b = startColor.b + (1.5 - opacity) * (endColor.b - startColor.b);

        const finalOpacity = opacity * 0.9; // slightly less to blend better
        ctx.strokeStyle = `rgba(${r},${g},${b},${finalOpacity})`;

        const thickness = Math.max(1, 3 - Math.abs(0.5 - opacity) * 6);
        ctx.lineWidth = thickness;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.restore(); //back to normal blend mode

      points.forEach((point) => {
        point.leaves?.forEach((leaf) => {
          if (leafImageRef.current) {
            ctx.save();
            //multiply for leaves
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = Math.min(leaf.life, point.life);

            ctx.translate(leaf.x, leaf.y);
            ctx.rotate((leaf.angle * Math.PI) / 180);

            ctx.drawImage(
              leafImageRef.current,
              -leaf.width / 2,
              -leaf.height,
              leaf.width,
              leaf.height
            );

            ctx.restore();
          }
        });

        point.letters?.forEach((letter) => {
            ctx.save();
            ctx.globalAlpha = Math.min(letter.life, point.life);
            ctx.translate(letter.x, letter.y);
            ctx.rotate(letter.angle);
          
            ctx.font = `${letter.size}px 'Cormorant Garamond', serif`;
            ctx.fillStyle = `rgba(60, 50, 40, ${letter.life})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter.char, 0, 0);
            ctx.restore();
          });
          
      });

      

      pointsRef.current = points
        .map((p) => ({ ...p, life: p.life - 0.01 }))
        .filter((p) => p.life > 0);

      //flashlight effect (radial gradient)
      const gradient = ctx.createRadialGradient(
        targetXRef.current,
        targetYRef.current,
        0,
        targetXRef.current,
        targetYRef.current,
        1000
      );
      
      gradient.addColorStop(0, 'rgba(255, 220, 180, 0.3)');
    //   gradient.addColorStop(0.8, 'rgba(220, 255, 100, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); 

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMouseMoving]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}
