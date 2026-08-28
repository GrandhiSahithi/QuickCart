import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LocationPicker from "./LocationPicker";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="navbar">
      <Link to="/" className="logo">QuickCart</Link>

      <LocationPicker />

      <nav>
        {user && user.role === "ADMIN" && <Link to="/admin">Admin</Link>}
        {user && <Link to="/orders">Orders</Link>}
        {user && !user.premium && <Link to="/premium" className="premium-link">QuickCart+</Link>}
        <Link to="/cart">Cart{count > 0 ? ` (${count})` : ""}</Link>
        {user ? (
          <>
            <Link to="/profile" className="nav-user">Hi, {user.name.split(" ")[0]}</Link>
            <button type="button" className="link-button" onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  );
}
