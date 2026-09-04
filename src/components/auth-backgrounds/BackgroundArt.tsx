import { useId, type CSSProperties } from "react";
import type { AuthBackground } from "./BackgroundPicker";
import { OrbitArt } from "./OrbitArt";

const MinimalArt = () => (
  <>
    <div className="portal-auth-grid" />
    <div className="portal-auth-glow" />
    <div className="portal-auth-orbit portal-auth-orbit-one" />
    <div className="portal-auth-orbit portal-auth-orbit-two" />
    <div className="portal-auth-word">MAXSOFT</div>
  </>
);

const FlowArt = () => {
  const gradient = useId();
  return (
    <>
      <div className="auth-flow-halo" />
      <svg className="auth-flow-art auth-art-parallax" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#26c6cd" stopOpacity=".1" />
            <stop offset=".45" stopColor="#1478bd" stopOpacity=".75" />
            <stop offset="1" stopColor="#69cbed" stopOpacity=".2" />
          </linearGradient>
        </defs>
        <g className="auth-flow-ribbon" fill="none" stroke={`url(#${gradient})`} strokeWidth="1.1">
          {Array.from({ length: 32 }, (_, index) => (
            <path key={index} d={`M -150 ${460 + index * 17} C 140 ${380 + index * 17}, 170 ${900 + index * 11}, 640 ${850 + index * 9} S 1100 ${-170 + index * 17}, 1600 ${110 + index * 19}`} />
          ))}
        </g>
        <g className="auth-flow-ribbon auth-flow-ribbon-far" fill="none" stroke={`url(#${gradient})`} strokeWidth=".8">
          {Array.from({ length: 16 }, (_, index) => (
            <path key={index} d={`M -100 ${120 + index * 10} C 300 ${400 + index * 7}, 410 ${-140 + index * 13}, 760 ${70 + index * 11} S 1300 ${500 + index * 7}, 1550 ${390 + index * 14}`} />
          ))}
        </g>
      </svg>
      <div className="auth-flow-light auth-flow-light-one" />
      <div className="auth-flow-light auth-flow-light-two" />
    </>
  );
};

const Crystal = ({ className }: { className: string }) => {
  const gradient = useId();
  const shine = useId();
  return (
    <svg className={className} viewBox="0 0 500 620" fill="none">
      <defs>
        <linearGradient id={gradient} x1="20" y1="20" x2="470" y2="550" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d7fbff" stopOpacity=".7" />
          <stop offset=".4" stopColor="#4dc6ee" stopOpacity=".55" />
          <stop offset="1" stopColor="#2563cc" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id={shine} x1="80" y1="0" x2="370" y2="530" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity=".9" />
          <stop offset=".45" stopColor="#91eaff" stopOpacity=".25" />
          <stop offset="1" stopColor="#1478bd" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${shine})`} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M250 20 460 150 425 450 245 595 40 440 55 160Z" fill={`url(#${gradient})`} />
        <path d="m250 20 40 265 170-135Z" fill="#dbfaff" fillOpacity=".48" />
        <path d="m250 20 40 265-235-125Z" fill="#bcefff" fillOpacity=".24" />
        <path d="m55 160 235 125-45 310L40 440Z" fill={`url(#${shine})`} fillOpacity=".54" />
        <path d="m290 285 170-135-35 300-180 145Z" fill="#1263b7" fillOpacity=".24" />
        <path d="m55 160 370 290M40 440l420-290M250 20 40 440m250-155 135 165" opacity=".45" />
      </g>
    </svg>
  );
};

const PrismArt = () => (
  <>
    <div className="auth-prism-wash" />
    <div className="auth-prism-plane" />
    <div className="auth-prism-layer auth-art-parallax">
      <Crystal className="auth-crystal auth-crystal-left" />
      <Crystal className="auth-crystal auth-crystal-right" />
      <Crystal className="auth-crystal auth-crystal-small" />
      {Array.from({ length: 5 }, (_, index) => (
        <i className="auth-glass-tile" key={index} style={{ "--tile": index } as CSSProperties} />
      ))}
    </div>
    <div className="auth-prism-caustic" />
  </>
);

export const BackgroundArt = ({ variant }: { variant: AuthBackground }) => {
  switch (variant) {
    case "minimal": return <MinimalArt />;
    case "flow": return <FlowArt />;
    case "prism": return <PrismArt />;
    case "orbit": return <OrbitArt />;
  }
};
