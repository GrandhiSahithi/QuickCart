import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [resetResult, setResetResult] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  function handleLogout() {
    logout();
    navigate("/login", { state: { portal: "admin" } });
  }

  function loadAll() {
    return Promise.all([adminApi.stats(), adminApi.orders(), adminApi.stores(), adminApi.customers()]).then(
      ([statsData, ordersData, storesData, customersData]) => {
        setStats(statsData);
        setOrders(ordersData);
        setStores(storesData);
        setCustomers(customersData);
      }
    );
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, []);

  // Resets the account's password server-side and shows the new temporary
  // password once, here, so it can be handed to the customer - QuickCart
  // never stores or displays a user's actual password (only its hash is
  // kept), so this reset-and-reveal is the only safe way to "see" one.
  function handleResetPassword(customer) {
    setResettingId(customer.id);
    adminApi
      .resetPassword(customer.id)
      .then((result) => setResetResult(result))
      .finally(() => setResettingId(null));
  }

  if (loading) return <main className="page-container"><p>Loading admin dashboard...</p></main>;

  return (
    <main className="page-container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Store and order oversight across QuickCart.</p>
        </div>
        <div className="admin-header-right">
          <span className="admin-muted">{user.email}</span>
          <button type="button" className="link-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={tab === "overview" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={tab === "orders" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("orders")}>
          Orders ({orders.length})
        </button>
        <button className={tab === "customers" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("customers")}>
          Customers ({customers.length})
        </button>
        <button className={tab === "stores" ? "admin-tab active" : "admin-tab"} onClick={() => setTab("stores")}>
          Stores ({stores.length})
        </button>
      </div>

      {tab === "overview" && stats && (
        <>
          <div className="admin-stat-row">
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.totalOrders}</span>
              <span className="admin-stat-label">Total Orders</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">${stats.totalRevenue.toFixed(2)}</span>
              <span className="admin-stat-label">Total Revenue</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">${stats.avgOrderValue.toFixed(2)}</span>
              <span className="admin-stat-label">Avg Order Value</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.totalCustomers}</span>
              <span className="admin-stat-label">Total Customers</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.premiumCustomers}</span>
              <span className="admin-stat-label">QuickCart+ Subscribers</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">{stats.newCustomersLast7Days}</span>
              <span className="admin-stat-label">New Signups (7d)</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-value">${stats.promoDiscountGiven.toFixed(2)}</span>
              <span className="admin-stat-label">Promo Discounts Given</span>
            </div>
          </div>

          <div className="admin-columns">
            <div>
              <h2>Orders by status</h2>
              <div className="admin-list">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="admin-list-row">
                    <span>{status.replace(/_/g, " ")}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2>Top selling products</h2>
              <div className="admin-list">
                {stats.topProducts.map((p) => (
                  <div key={p.name} className="admin-list-row">
                    <span>{p.name}</span>
                    <strong>{p.count} sold · ${p.revenue.toFixed(2)}</strong>
                  </div>
                ))}
                {stats.topProducts.length === 0 && <p className="admin-empty">No sales yet.</p>}
              </div>
            </div>

            <div>
              <h2>Top stores by revenue</h2>
              <div className="admin-list">
                {stats.topStores.map((s) => (
                  <div key={s.name} className="admin-list-row">
                    <span>{s.name}</span>
                    <strong>{s.count} orders · ${s.revenue.toFixed(2)}</strong>
                  </div>
                ))}
                {stats.topStores.length === 0 && <p className="admin-empty">No sales yet.</p>}
              </div>
            </div>

            <div>
              <h2>Revenue by category</h2>
              <div className="admin-list">
                {Object.entries(stats.revenueByVertical).map(([vertical, revenue]) => (
                  <div key={vertical} className="admin-list-row">
                    <span>{vertical}</span>
                    <strong>${revenue.toFixed(2)}</strong>
                  </div>
                ))}
                {Object.keys(stats.revenueByVertical).length === 0 && <p className="admin-empty">No sales yet.</p>}
              </div>
            </div>

            <div>
              <h2>Stores currently running offers ({stats.activeOffers.length})</h2>
              <div className="admin-list admin-list-scroll">
                {stats.activeOffers.map((o) => (
                  <div key={o.storeId} className="admin-list-row admin-offer-row">
                    <span>
                      {o.storeName} <span className="admin-muted">· {o.vertical}</span>
                    </span>
                    <span className="admin-offer-tags">
                      {o.offers.map((offer) => (
                        <span key={offer} className="admin-offer-tag">{offer}</span>
                      ))}
                    </span>
                  </div>
                ))}
                {stats.activeOffers.length === 0 && <p className="admin-empty">No stores have an active offer.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{o.customerName}<br /><span className="admin-muted">{o.customerEmail}</span></td>
                  <td>{o.storeName}</td>
                  <td><span className={`status-badge status-${o.status.toLowerCase()}`}>{o.status.replace(/_/g, " ")}</span></td>
                  <td>${o.totalAmount.toFixed(2)}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="admin-empty">No orders yet.</p>}
        </div>
      )}

      {tab === "customers" && (
        <div className="admin-table-wrap">
          <p className="admin-note">
            Passwords are stored as one-way hashes - QuickCart can't show you (or anyone) a customer's actual
            password. To help someone who's locked out, reset it below to generate a new temporary password.
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>QuickCart+</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{c.name}</td>
                  <td className="admin-muted">{c.email}</td>
                  <td>{c.role}</td>
                  <td>{c.premium ? "✓" : "—"}</td>
                  <td className="admin-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>{c.orderCount}</td>
                  <td>${c.totalSpent.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      disabled={resettingId === c.id}
                      onClick={() => handleResetPassword(c)}
                    >
                      {resettingId === c.id ? "Resetting..." : "Reset password"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <p className="admin-empty">No accounts yet.</p>}
        </div>
      )}

      {resetResult && (
        <div className="admin-modal-backdrop" onClick={() => setResetResult(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Password reset</h2>
            <p>
              New temporary password for <strong>{resetResult.email}</strong>. Share it with the customer directly -
              it will not be shown again, and they should change it after logging in.
            </p>
            <div className="admin-temp-password">{resetResult.temporaryPassword}</div>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigator.clipboard?.writeText(resetResult.temporaryPassword)}
            >
              Copy
            </button>
            <button type="button" className="link-button" onClick={() => setResetResult(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {tab === "stores" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Vertical</th>
                <th>Rating</th>
                <th>ETA</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.vertical}</td>
                  <td>⭐ {s.rating}</td>
                  <td>{s.etaMinutes} min</td>
                  <td className="admin-muted">{s.lat.toFixed(3)}, {s.lng.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
