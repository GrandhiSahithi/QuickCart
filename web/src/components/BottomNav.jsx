import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";

const TABS = [
  { to: "/", label: "Home", icon: "🏠", exact: true },
  { to: "/cart", label: "Cart", icon: "🛒" },
  { to: "/orders", label: "Orders", icon: "📦" },
  { to: "/profile", label: "Profile", icon: "👤" }
];

export default function BottomNav() {
  const location = useLocation();
  const { count } = useCart();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
        return (
          <Link key={tab.to} to={tab.to} className={`bottom-nav-tab${active ? " active" : ""}`}>
            <span className="bottom-nav-icon">
              {tab.icon}
              {tab.to === "/cart" && count > 0 && <span className="bottom-nav-badge">{count}</span>}
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
