'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import p5 from 'p5';

declare global {
  interface Window {
    p5: typeof p5;
  }
}

export default function LeafCanvas({ seed,  onProgressUpdate }: { seed: string; onProgressUpdate: (progress: number) => void }) {
  const sketchRef = useRef<HTMLDivElement>(null);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {
    const canvasParent = sketchRef.current;
    if (!canvasParent) return;

    //only generate new if not in local storage
    const existingImage = localStorage.getItem(`leaf-${seed}`);
    if (existingImage) {
      const img = new Image();
      img.src = existingImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvasParent.innerHTML = ''; // clear previous
          canvasParent.appendChild(canvas);
        }
        onProgressUpdate(100);
      };
      return;
    }

    let p5Instance: p5 | undefined;

    if (typeof window !== 'undefined' && window.p5 && sketchRef.current) {
      const sketch = (p: p5) => {
        const angle = 70;
        const generations = 9;

        const b = 5;
        const c = 1.15;
        const d = 3;
        const e = 1.2;
        const f = 1;

        let sentence = '{.A(0)}';

        p.randomSeed(Number(seed));

        const leftPoints: p5.Vector[] = [];
        const rightPoints: p5.Vector[] = [];
        let collectingSide: 'left' | 'right' = 'left';

        function expand(current: string): string {
          return current
            .replace(/A\((\d+)\)/g, (_, iStr) => {
              const i = parseInt(iStr);
              if (i > generations) return '';
              return `F(${(b * Math.pow(c, i)).toFixed(2)})[-B(${i})][A(${i + 1})][+B(${i})]`;
            })
            .replace(/B\((\d+)\)/g, (_, iStr) => {
              const i = parseInt(iStr);
              if (i <= 0) return '';
              const scale = (i % 2 === 0) ? 0.1 : 2.5;
              const randomness = 1 + p.random(-0.2, 0.2); // 20% variation
              const length = d * Math.pow(e, i) * scale * randomness;
              if (i === generations - 1) {
                return `F(${(length * 6).toFixed(2)})`;
              }
              
              return `F(${length.toFixed(2)})B(${Math.max(i - f, 0)})`;
            });
        }

        for (let i = 0; i < generations; i++) {
          sentence = expand(sentence);
        }

        class Turtle {
          pos = p.createVector(0, 0);
          angle = -90;
          stack: { pos: p5.Vector; angle: number }[] = [];

          globalScale = 8;

          forward(length: number, collect: boolean) {
            const scaled = length * this.globalScale;
            const rad = p.radians(this.angle);
            const dx = scaled * p.cos(rad);
            const dy = scaled * p.sin(rad);
            const newPos = p.createVector(this.pos.x + dx, this.pos.y + dy);
            p.line(this.pos.x, this.pos.y, newPos.x, newPos.y);
            p.fill('none');
            p.stroke(255);
            p.strokeWeight(0);

            if (collect) {
              if (collectingSide === 'left') leftPoints.push(newPos.copy());
              else if (collectingSide === 'right') rightPoints.push(newPos.copy());
            }
            this.pos = newPos.copy();
          }

          rotate(delta: number) {
            this.angle += delta;
          }

          push() {
            this.stack.push({ pos: this.pos.copy(), angle: this.angle });
          }

          pop() {
            const state = this.stack.pop();
            if (state) {
              this.pos = state.pos;
              this.angle = state.angle;
            }
          }
        }

        function drawLSystem(turtle: Turtle, s: string) {
          const branchTipIndices = findBranchTipIndices(s);

          for (let i = 0; i < s.length; i++) {
            const ch = s[i];

            if (ch === 'F') {
              const match = s.slice(i).match(/^F\((\d+\.?\d*)\)/);
              if (match) {
                const len = parseFloat(match[1]);
                const collect = branchTipIndices.has(i);
                turtle.forward(len, collect);
                i += match[0].length - 1;
              }
            } else if (ch === '+') {
              const randomAngle = angle + p.random(-10, 10) + 11 * i;
              turtle.rotate(randomAngle);
              collectingSide = 'right';
            } else if (ch === '-') {
              const randomAngle = -angle + p.random(-10, 10) - 11 * (i + 40) - 5 * (sentence.length - i);
              turtle.rotate(randomAngle);
              collectingSide = 'left';
            } else if (ch === '[') {
              turtle.push();
            } else if (ch === ']') {
              turtle.pop();
            }
          }
        }

        function findBranchTipIndices(s: string): Set<number> {
          const tips = new Set<number>();
          const stack: number[] = [];

          for (let i = 0; i < s.length; i++) {
            if (s[i] === '[') {
              stack.push(i);
            } else if (s[i] === ']') {
              const start = stack.pop();
              if (start !== undefined) {
                const block = s.slice(start, i + 1);
                const matches = [...block.matchAll(/F\((\d+\.?\d*)\)/g)];
                if (matches.length > 0) {
                  const last = matches[matches.length - 1];
                  tips.add(start + block.indexOf(last[0]));
                }
              }
            }
          }

          return tips;
        }
        
        function getCurvePolyline(points: p5.Vector[], detail = 30): p5.Vector[] {
          if (points.length < 2) return points;

          const padded = [
            points[0].copy(), // duplicate first
            ...points,
            points[points.length - 1].copy(), // duplicate last
            points[points.length - 1].copy()  // duplicate last again
          ];
        
          const path: p5.Vector[] = [];
          for (let t = 0; t < padded.length - 3; t++) {
            for (let i = 0; i <= detail; i++) {
              const pct = i / detail;
              const x = p.curvePoint(
                padded[t].x, padded[t + 1].x, padded[t + 2].x, padded[t + 3].x, pct
              );
              const y = p.curvePoint(
                padded[t].y, padded[t + 1].y, padded[t + 2].y, padded[t + 3].y, pct
              );
              path.push(p.createVector(x, y));
            }
          }
          return path;
        }

        function worley(x: number, y: number, points: p5.Vector[], p: p5): number {
          let minDist = Infinity;
          for (const pt of points) {
            const d = p.dist(x, y, pt.x, pt.y);
            if (d < minDist) minDist = d;
          }
          return minDist;
        }

        // function getDistanceToPath(pt: p5.Vector, path: p5.Vector[]): number {
        //   let minDist = Infinity;
        //   for (let i = 0; i < path.length - 1; i++) {
        //     const a = path[i];
        //     const b = path[i + 1];
        //     const d = Math.sqrt(p.sq(b.x - a.x) + p.sq(b.y - a.y));
        //     if (d < minDist) minDist = d;
        //   }
        //   return minDist;
        // }

        
        
        p.setup = async () => {
          const parentElement = sketchRef.current;
          if (parentElement) {
            p.createCanvas(1000, 700).parent(parentElement);
          }
          onProgressUpdate(0);
          await sleep(30);
          console.log(0);
          p.clear();
          p.noStroke();
          p.noFill();
          p.angleMode(p.DEGREES);
          p.pixelDensity(1);

          p.push();
          p.translate(p.width / 8, p.height / 2); 
          p.fill(180, 230, 120);

          p.noStroke();
          p.beginShape();
          for (const pt of leftPoints) p.curveVertex(pt.x, pt.y);
          for (let i = rightPoints.length - 1; i >= 0; i--) p.curveVertex(rightPoints[i].x, rightPoints[i].y);
          p.endShape(p.CLOSE);
          p.pop();


          onProgressUpdate(10);
          await sleep(30);
          console.log(10);
          
          const shapeTurtle = new Turtle();
          drawLSystem(shapeTurtle, sentence);

          rightPoints.reverse();

          const stemTip = shapeTurtle.pos.copy();
          leftPoints.reverse();
          leftPoints.push(stemTip);
          leftPoints.reverse();

          rightPoints.push(stemTip.copy().add(p.createVector(760, 0)));

          const fillGraphics = p.createGraphics(p.width, p.height);

          fillGraphics.clear();
          const leafPath: p5.Vector[] = [];
          for (const pt of leftPoints) {
            leafPath.push(p.createVector(pt.x + p.width / 8, pt.y + p.height / 2));
          }

          for (let i = rightPoints.length - 1; i >= 0; i--) {
            const pt = rightPoints[i];
            leafPath.push(p.createVector(pt.x + p.width / 8, pt.y + p.height / 2));
          }

          onProgressUpdate(20);
          await sleep(30);
          console.log(20);

          const translatedLeafPath = getCurvePolyline(leafPath);
          
          fillGraphics.noStroke();

          fillGraphics.loadPixels();

          //mask reference to quickly check if point is inside leaf
          const mask = p.createGraphics(p.width, p.height);
          mask.noStroke();
          mask.fill(255);
          mask.beginShape();
          for (const pt of translatedLeafPath) mask.vertex(pt.x, pt.y);
          mask.endShape(p.CLOSE);
          mask.loadPixels();

          const gradientLayer = p.createGraphics(p.width, p.height);
          gradientLayer.loadPixels();

          for (let y = 0; y < gradientLayer.height; y++) {
            for (let x = 0; x < gradientLayer.width; x++) {
              const i = 4 * (x + y * gradientLayer.width);
              if (mask.get(x, y)[0] === 255) {
                const nx = x / gradientLayer.width;
                const ny = y / gradientLayer.height;
                const dist = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2);
                const t = Math.min(dist * Math.SQRT2, 1.0); // normalize

                const r = 70 + 90 * t;
                const g = 170 - 100 * t;
                const b = 80 - 30 * t;

                gradientLayer.pixels[i] = r;
                gradientLayer.pixels[i + 1] = g;
                gradientLayer.pixels[i + 2] = b;
                gradientLayer.pixels[i + 3] = 255;
              }
            }
          }
          gradientLayer.updatePixels();
          p.image(gradientLayer, 0, 0);


          const blurBranches = p.createGraphics(p.width, p.height);
          blurBranches.clear();
          blurBranches.push();
          blurBranches.translate(p.width / 8, p.height / 2);
          blurBranches.stroke(255);

          blurBranches.strokeWeight(15);
          blurBranches.noFill();

          const blurTurtle = new Turtle();
          blurTurtle.forward = function(length: number) {
            const actualScaled = length * this.globalScale;
            // const visualScaled = actualScaled * visualScale;
          
            const rad = p.radians(this.angle);
            const dx = actualScaled * p.cos(rad);
            const dy = actualScaled * p.sin(rad);
          
            // const dxVisual = visualScaled * p.cos(rad);
            // const dyVisual = visualScaled * p.sin(rad);
          
            // const visualEnd = p.createVector(this.pos.x + dxVisual, this.pos.y + dyVisual);
            // blurBranches.line(this.pos.x, this.pos.y, visualEnd.x, visualEnd.y);
          
            // advance turtle position fully
            this.pos = p.createVector(this.pos.x + dx, this.pos.y + dy);
          };
          
          drawLSystem(blurTurtle, sentence);
          blurBranches.pop();
          blurBranches.filter(p.BLUR, 20); //blur intensity
          p.image(blurBranches, 0, 0);

          
          //start generating points for worley noise cells
          const featurePoints: p5.Vector[] = [];
          const nPoints = 1000;
          
          while (featurePoints.length < nPoints) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            const pt = p.createVector(x, y);
            if (mask.get(x, y)[0] === 255) {
              featurePoints.push(pt);
            }
          }

          console.log(featurePoints);
          onProgressUpdate(25);
          await sleep(30);
          // pixels with global space logic
          for (let y = 0; y < fillGraphics.height; y++) {
            for (let x = 0; x < fillGraphics.width; x++) {
              const i = 4 * (x + y * fillGraphics.width);
              const current = p.createVector(x, y);

                        
              if (!mask.get(x, y)[0]) {
                fillGraphics.pixels[i] = 0;
                continue;
              }
              let nearest = Infinity;
              let secondNearest = Infinity;

              for (const pt of featurePoints) {
                const d = pt.dist(current);
                if (d < nearest) {
                  secondNearest = nearest;
                  nearest = d;
                } else if (d < secondNearest) {
                  secondNearest = d;
                }
              }

              const edgeFactor = secondNearest - nearest;


              // edges white
              if (edgeFactor < 0.1) {
                fillGraphics.pixels[i + 0] = 255;
                fillGraphics.pixels[i + 1] = 255;
                fillGraphics.pixels[i + 2] = 255;
                fillGraphics.pixels[i + 3] = 80 * ((fillGraphics.height - y) / fillGraphics.height);
              } else {
                // light center to dark edge
                const shadow = p.map(edgeFactor, 0, 20, 80, 0);
              
                // base color (light to dark green)
                const baseR = p.map(nearest, 0, 50, 100, 50);
                const baseG = p.map(nearest, 0, 50, 160, 100);
                const baseB = p.map(nearest, 0, 50, 80, 30);
                
                // dark edges
                fillGraphics.pixels[i + 0] = p.constrain(baseR - shadow * 0.5, 0, 255);
                fillGraphics.pixels[i + 1] = p.constrain(baseG - shadow * 0.6, 0, 255);
                fillGraphics.pixels[i + 2] = p.constrain(baseB - shadow * 0.4, 0, 255);
                fillGraphics.pixels[i + 3] = p.map(shadow, 0, 80, 150, 50); // higher opacity at edges
              }
              
              
            }
          }
          
          fillGraphics.updatePixels();
          onProgressUpdate(50);
          await sleep(30);
          console.log(50);

          const cellCount = 50;
          const cellPoints: p5.Vector[] = [];
          for (let i = 0; i < cellCount; i++) {
            cellPoints.push(p.createVector(p.random(p.width), p.random(p.height)));
          }

          for (let i = 0; i < 50000; i++) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            if (mask.get(x, y)[0] === 255) {
              const dist = worley(x, y, cellPoints, p);
              const shade = p.map(dist, 0, 50, 255, 100);
              const alpha = p.map(dist, 0, 50, 80, 20);
              const radius = p.map(dist, 0, 50, 0.5, 2);
              fillGraphics.stroke(255, alpha);
              fillGraphics.strokeWeight(0.5);
              fillGraphics.noFill();
              fillGraphics.circle(x, y, radius);

              fillGraphics.noStroke();
              fillGraphics.fill(shade, 160, shade, 10); 
              fillGraphics.circle(x, y, 1);
            }
          }

          // for (let i = 0; i < 60000; i++) {
          //   const x = p.random(p.width);
          //   const y = p.random(p.height);
          //   const testPt = p.createVector(x, y);
            
          //   if (p5InsidePolygon(testPt, translatedLeafPath)) {
          //     const c = p.color(40 + p.random(-20, 20), 140 + p.random(-20, 20), 40 + p.random(-10, 10), 10);
          //     fillGraphics.fill(c);
          //     fillGraphics.circle(x, y, p.random(2, 4));
          //   }
          // }
          onProgressUpdate(70);
          await sleep(30);
          console.log(70);

          const redCellCount = 50;
          const redCellPoints: p5.Vector[] = [];
          for (let i = 0; i < redCellCount; i++) {
            redCellPoints.push(p.createVector(p.random(p.width), p.random(p.height)));
          }

          for (let i = 0; i < 50000; i++) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            if (mask.get(x, y)[0] === 255) {
              const dist = worley(x, y, redCellPoints, p);
              const shade = p.map(dist, 0, 50, 255, 180);
              const alpha = p.map(dist, 0, 50, 80, 20);
              const radius = p.map(dist, 0, 50, 0.5, 2);
              fillGraphics.stroke(255, alpha);
              fillGraphics.strokeWeight(0.5);
              fillGraphics.noFill();
              fillGraphics.circle(x, y, radius);

              fillGraphics.noStroke();
              fillGraphics.fill(shade, 160, shade, 50); 
              fillGraphics.circle(x, y, 1);
            }
          }
          onProgressUpdate(80);
          await sleep(30);
          console.log(80);

          p.push();
          p.image(fillGraphics, 0, 0);
          p.pop();

          p.push();
          p.translate(p.width / 8, p.height / 2); // match l system translation
          
          // bezier curve stem
          const base = p.createVector(-50, 15);
          const cp1 = p.createVector(120, -15); 
          const cp2 = p.createVector(340, -40);  
          const tip = p.createVector(560, -15); 
          
          const steps = 100;
          for (let t = 0; t < 1; t += 1 / steps) {
            const x1 = p.bezierPoint(base.x, cp1.x, cp2.x, tip.x, t);
            const y1 = p.bezierPoint(base.y, cp1.y, cp2.y, tip.y, t);
            const x2 = p.bezierPoint(base.x, cp1.x, cp2.x, tip.x, t + 1 / steps);
            const y2 = p.bezierPoint(base.y, cp1.y, cp2.y, tip.y, t + 1 / steps);
          
            let r, g, b;
            if (t < 0.3) {
              // brown > dark green
              r = p.lerp(120, 70, t / 0.2);
              g = p.lerp(70, 100, t / 0.2);
              b = p.lerp(40, 70, t / 0.2);
            } else {
              // dark green > light green
              r = p.lerp(70, 220, (t - 0.3) / 0.8);
              g = p.lerp(100, 250, (t - 0.3) / 0.8);
              b = p.lerp(70, 180, (t - 0.3) / 0.8);
            }


            const weight= p.lerp(6, 0.5, t); // vary stem weight
          
            p.stroke(r, g, b, 255);
            p.strokeWeight(weight);
            p.line(x1, y1, x2, y2);
          }

          onProgressUpdate(90);
          await sleep(30);
          console.log(90);
          p.pop();
          
          p.frameRate(1); //ensure draw is done
          p.draw = () => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
              const dataUrl = canvas.toDataURL();
              localStorage.setItem(`leaf-${seed}`, dataUrl);
            }
          };
        };
      };

      onProgressUpdate(100);
      console.log(100);

      
      if (sketchRef.current.firstChild) {
        sketchRef.current.removeChild(sketchRef.current.firstChild);
      }

      new window.p5(sketch, sketchRef.current);

      return () => {
        if (p5Instance) {
          p5Instance.remove();
        }
      };
    }
  }, [seed, onProgressUpdate]);

  return (
    <div className='w-full h-full flex flex-col'>
    <div ref={sketchRef} className="w-[100svh] h-[100svh] hover:bg-white/50" />
    <button
      onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.download = `cordate-leaf-${seed}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              }
            }}
            className="absolute top-2 left-40 p-2 border rounded bg-white"
          >
        Download PNG
    </button>
            <Link 
            className="absolute top-2 right-40 p-2 border rounded bg-white"
            href={`/write?seed=${seed}`}>
            Write a letter
            </Link>
    </div>
);
}