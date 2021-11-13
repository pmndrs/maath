import logo from "../logo.svg";

const Header: React.FC = () => {
  return (
    <a
      href="https://github.com/pmndrs/maath"
      title="Maath - View on github"
      className="logo"
    >
      <img src={logo} />
      <div>View on Github ⟶</div>
    </a>
  );
};

export default Header