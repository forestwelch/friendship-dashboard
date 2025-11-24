"use client";

import { useEffect, useRef, useMemo } from "react";
import styles from "./test.module.css";
import { generateBoxShadowCircle } from "./generate-box-shadow";

function CanvasPiece({ testNum }: { testNum: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const color = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#E9698D";
        
        if (testNum === 7) {
          // Simple circle
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(20, 20, 16, 0, Math.PI * 2);
          ctx.fill();
        } else if (testNum === 17) {
          // Pixelated circle using midpoint algorithm
          const radius = 16;
          let x = 0;
          let y = radius;
          let d = 1 - radius;
          
          const plotPoints = (px: number, py: number) => {
            ctx.fillRect(20 + px, 20 + py, 1, 1);
            ctx.fillRect(20 - px, 20 + py, 1, 1);
            ctx.fillRect(20 + px, 20 - py, 1, 1);
            ctx.fillRect(20 - px, 20 - py, 1, 1);
            ctx.fillRect(20 + py, 20 + px, 1, 1);
            ctx.fillRect(20 - py, 20 + px, 1, 1);
            ctx.fillRect(20 + py, 20 - px, 1, 1);
            ctx.fillRect(20 - py, 20 - px, 1, 1);
          };
          
          ctx.fillStyle = color;
          plotPoints(x, y);
          
          while (x < y) {
            if (d < 0) {
              d += 2 * x + 3;
            } else {
              d += 2 * (x - y) + 5;
              y--;
            }
            x++;
            plotPoints(x, y);
          }
        }
      }
    }
  }, [testNum]);
  
  return <canvas ref={canvasRef} className={styles.canvasPiece} width="40" height="40" />;
}

export default function ConnectFourTestPage() {
  const tests = Array.from({ length: 30 }, (_, i) => i + 1);
  const primaryColor = useMemo(() => {
    if (typeof window !== "undefined") {
      return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#E9698D";
    }
    return "#E9698D";
  }, []);
  
  const boxShadowCircle = useMemo(() => {
    return generateBoxShadowCircle(16, primaryColor, 1);
  }, [primaryColor]);
  
  const boxShadowCell = useMemo(() => {
    // Generate pixelated circle outline for cell - use secondary color
    // Radius ~18px for cell outline
    return generateBoxShadowCircle(18, "var(--secondary)", 1, false);
  }, []);
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CONNECT FOUR CIRCLE TESTS (30 APPROACHES)</h1>
      
      <div className={styles.gridsContainer}>
        {tests.map((testNum) => (
          <div key={testNum} className={styles.testGrid}>
            <h2 className={styles.testLabel}>Test {testNum}</h2>
            <div className={styles.board}>
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className={styles.row}>
                  {Array.from({ length: 7 }).map((_, col) => {
                    const hasPiece = (row === 5 && col === 3) || (row === 4 && col === 3);
                    return (
                      <div 
                        key={col} 
                        className={`${styles.cell} ${styles[`test${testNum}`]}`}
                        style={testNum === 1 ? { boxShadow: boxShadowCell } : undefined}
                      >
                        {hasPiece && (
                          <>
                            {testNum === 7 || testNum === 17 ? (
                              <CanvasPiece testNum={testNum} />
                            ) : testNum === 1 ? (
                              <div 
                                className={`${styles.piece} ${styles.test1Piece}`}
                                style={{ boxShadow: boxShadowCircle }}
                              />
                            ) : (
                              <div className={`${styles.piece} ${styles[`test${testNum}Piece`]}`} />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
