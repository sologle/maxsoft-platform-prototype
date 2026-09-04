import { useId, type CSSProperties } from "react";

// Fixed geometry keeps the decorative scene stable across renders and devices.
const nodes = Array.from({ length: 96 }, (_, index) => {
  const latitude = Math.acos(1 - (2 * (index + 0.5)) / 96);
  const longitude = index * Math.PI * (3 - Math.sqrt(5));
  return {
    x: 300 + 265 * Math.sin(latitude) * Math.cos(longitude),
    y: 300 + 265 * Math.cos(latitude),
    depth: Math.sin(latitude) * Math.sin(longitude),
  };
}).filter((node) => node.depth > -0.15);

const connections = nodes.flatMap((node, index) => nodes.slice(index + 1).flatMap((other, offset) => {
  const distance = Math.hypot(node.x - other.x, node.y - other.y);
  return distance < 105 ? [{ from: index, to: index + offset + 1 }] : [];
}));

export const OrbitArt = () => {
  const halo = useId();
  const surface = useId();
  return (
    <>
      <div className="auth-orbit-aurora" />
      <div className="auth-orbit-stars">
        {Array.from({ length: 56 }, (_, index) => (
          <i key={index} style={{
            left: `${(index * 61.8) % 100}%`,
            top: `${(index * 37.3) % 100}%`,
            "--star-delay": `${-index * 0.7}s`,
            "--star-size": `${index % 5 === 0 ? 4 : 2}px`,
          } as CSSProperties} />
        ))}
      </div>
      <div className="auth-orbit-globe auth-art-parallax">
        <svg viewBox="0 0 600 600" fill="none">
          <defs>
            <radialGradient id={halo}>
              <stop stopColor="#63ddff" stopOpacity=".08" />
              <stop offset=".83" stopColor="#218ddb" stopOpacity=".06" />
              <stop offset=".9" stopColor="#41c3f8" stopOpacity=".3" />
              <stop offset="1" stopColor="#41c3f8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={surface} cx=".25" cy=".2" r=".85">
              <stop stopColor="#e6fbff" stopOpacity=".05" />
              <stop offset=".7" stopColor="#1478bd" stopOpacity=".08" />
              <stop offset="1" stopColor="#1478bd" stopOpacity=".35" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="300" r="298" fill={`url(#${halo})`} />
          <circle cx="300" cy="300" r="265" fill={`url(#${surface})`} stroke="currentColor" strokeOpacity=".5" />
          <g stroke="currentColor" strokeWidth=".65" opacity=".32">
            {[48, 110, 172, 226, 256].map((radius) => <ellipse key={radius} cx="300" cy="300" rx={radius} ry="265" />)}
            {[-210, -140, -70, 0, 70, 140, 210].map((offset) => (
              <ellipse key={offset} cx="300" cy={300 + offset} rx={Math.sqrt(265 ** 2 - offset ** 2)} ry="28" />
            ))}
          </g>
          <g stroke="currentColor" strokeWidth=".8" opacity=".42">
            {connections.map(({ from, to }) => <path key={`${from}-${to}`} d={`M${nodes[from].x} ${nodes[from].y}L${nodes[to].x} ${nodes[to].y}`} />)}
          </g>
          <g fill="currentColor">
            {nodes.map((node, index) => (
              <circle className="auth-orbit-node" key={index} cx={node.x} cy={node.y} r={index % 5 === 0 ? 3.5 : 1.6} style={{ animationDelay: `${-index * .3}s` }} />
            ))}
          </g>
          <g className="auth-globe-scan" stroke="currentColor" strokeWidth="1.5" strokeDasharray="90 190 4 90" opacity=".7">
            <circle cx="300" cy="300" r="280" />
          </g>
        </svg>
      </div>
      <div className="auth-orbit-track auth-orbit-track-one"><span /></div>
      <div className="auth-orbit-track auth-orbit-track-two"><span /></div>
      <div className="auth-orbit-horizon" />
    </>
  );
};
