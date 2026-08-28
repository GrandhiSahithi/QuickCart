import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import LiveChat from "./components/LiveChat";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import StoreDetail from "./pages/StoreDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./context/AuthContext";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user || user.role !== "ADMIN") return <Navigate to="/login" state={{ portal: "admin" }} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/forgot-password";
  const showAppChrome = user && !isAdminRoute && !isAuthRoute;
  // Keep the support bubble off the payment step - it has no room to float
  // without sitting on top of the order total at typical phone heights.
  const showLiveChat = showAppChrome && location.pathname !== "/checkout";

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <div className={showAppChrome ? "app-content-with-bottom-nav" : undefined}>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Landing />} />
          <Route path="/store/:id" element={<RequireAuth><StoreDetail /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderTracking /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Routes>
      </div>
      {showAppChrome && <BottomNav />}
      {showLiveChat && <LiveChat />}
    </>
  );
}
