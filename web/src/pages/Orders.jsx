import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.mine().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page-container"><p>Loading orders...</p></main>;

  if (!orders.length) {
    return (
      <main className="page-container">
        <h1>Your Orders</h1>
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Your order history will show up here.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>Your Orders</h1>

      <div className="orders-list">
        {orders.map((order) => (
          <Link to={`/orders/${order.id}`} key={order.id} className="order-row">
            <div>
              <strong>{order.storeName}</strong>
              <div className="order-row-meta">
                {new Date(order.createdAt).toLocaleString()} · {order.items.length} item(s)
              </div>
            </div>
            <div className="order-row-right">
              <span className={`status-badge status-${order.status.toLowerCase()}`}>
                {order.status.replace(/_/g, " ")}
              </span>
              <strong>${order.totalAmount.toFixed(2)}</strong>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
