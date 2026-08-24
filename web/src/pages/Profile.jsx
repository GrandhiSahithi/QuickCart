import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <main className="page-container">
      <h1>Your Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="profile-card">
        <div>
          <h2>{user.premium ? "QuickCart+ member" : "Not a QuickCart+ member yet"}</h2>
          <p className="profile-email">
            {user.premium
              ? "You're getting free delivery on every order."
              : "Get free delivery on every order for $7.99/mo."}
          </p>
        </div>
        {!user.premium && (
          <Link to="/premium" className="primary-button">
            View QuickCart+
          </Link>
        )}
      </div>

      <div className="profile-actions">
        <Link to="/orders" className="secondary-button">
          Order History
        </Link>
        <button type="button" className="secondary-button danger-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </main>
  );
}
