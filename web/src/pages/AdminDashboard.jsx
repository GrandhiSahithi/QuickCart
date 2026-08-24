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

  function handleLogout() {
    logout();
    navigate("/login", { state: { portal: "admin" } });
  }

  useEffect(() => {
    Promise.all([adminApi.stats(), adminApi.orders(), adminApi.stores(), adminApi.customers()])
      .then(([statsData, ordersData, storesData, customersData]) => {
        setStats(statsData);
        setOrders(ordersData);
        setStores(storesData);
        setCustomers(customersData);
      })
      .finally(() => setLoading(false));
  }, []);

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
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <p className="admin-empty">No accounts yet.</p>}
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
