"use client";

import { useEffect, useRef } from "react";

const WIDTH = 80;
const HEIGHT = 22;
const R1 = 1;
const R2 = 2;
const K2 = 5;
const K1 = (WIDTH * K2 * 3) / (8 * (R1 + R2));
const THETA_SPACING = 0.07;
const PHI_SPACING = 0.02;
const CHARS = ".,-~:;=!*#$@";

export default function DonutAnimation() {
  const preRef = useRef<HTMLPreElement>(null);
  const frameRef = useRef<number>(0);
  const ARef = useRef(0);
  const BRef = useRef(0);

  useEffect(() => {
    const buffer = new Array(WIDTH * HEIGHT).fill(" ");
    const zbuffer = new Float32Array(WIDTH * HEIGHT);

    function render() {
      buffer.fill(" ");
      zbuffer.fill(0);
      const A = ARef.current;
      const B = BRef.current;
      const cosA = Math.cos(A);
      const sinA = Math.sin(A);
      const cosB = Math.cos(B);
      const sinB = Math.sin(B);

      for (let theta = 0; theta < 2 * Math.PI; theta += THETA_SPACING) {
        const costheta = Math.cos(theta);
        const sintheta = Math.sin(theta);
        const circlex = R2 + R1 * costheta;
        const circley = R1 * sintheta;

        for (let phi = 0; phi < 2 * Math.PI; phi += PHI_SPACING) {
          const cosphi = Math.cos(phi);
          const sinphi = Math.sin(phi);

          const x =
            circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * cosA * sinB;
          const y =
            circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * cosB;
          const z = K2 + cosA * circlex * sinphi + circley * sinA;
          const ooz = 1 / z;

          const xp = Math.floor(WIDTH / 2 + K1 * ooz * x);
          const yp = Math.floor(HEIGHT / 2 - K1 * ooz * y);
          const o = xp + WIDTH * yp;

          const Nx =
            costheta * (cosB * cosphi + sinA * sinB * sinphi) - sintheta * cosA * sinB;
          const Ny =
            costheta * (sinB * cosphi - sinA * cosB * sinphi) + sintheta * cosA * cosB;
          const Nz = cosA * costheta * sinphi + sinA * sintheta;
          const L = Ny - Nz;

          if (L > 0 && xp >= 0 && xp < WIDTH && yp >= 0 && yp < HEIGHT && ooz > zbuffer[o]) {
            zbuffer[o] = ooz;
            const idx = Math.floor(L * 8);
            buffer[o] = CHARS[Math.min(idx, CHARS.length - 1)];
          }
        }
      }

      const lines: string[] = [];
      for (let j = 0; j < HEIGHT; j++) {
        lines.push(buffer.slice(j * WIDTH, (j + 1) * WIDTH).join(""));
      }
      const out = lines.join("\n");

      if (preRef.current) preRef.current.textContent = out;

      ARef.current += 0.04;
      BRef.current += 0.02;
      frameRef.current = requestAnimationFrame(render);
    }

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <pre
      ref={preRef}
      className="font-mono text-[8px] sm:text-[10px] leading-tight text-[var(--accent)] whitespace-pre m-auto select-none"
      style={{ fontFamily: "var(--font-mono), monospace" }}
      aria-hidden
    >
      {" "}
    </pre>
  );
}
