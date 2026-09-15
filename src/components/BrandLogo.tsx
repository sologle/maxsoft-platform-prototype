import blue from "../assets/brand/maxsoft-logo-blue.png";
import white from "../assets/brand/maxsoft-logo-white.png";
import "./brand.css";

export const BrandLogo = () => <span className="brand-logo">
  <img className="brand-logo-light" src={blue} alt="Макссофт" width={3640} height={674} />
  <img className="brand-logo-dark" src={white} alt="Макссофт" width={3640} height={674} />
</span>;
