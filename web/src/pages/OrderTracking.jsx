import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { orderApi } from "../services/api";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

function pinIcon(emoji) {
  return L.divIcon({ className: "map-pin", html: emoji, iconSize: [30, 30] });
}

const storeIcon = pinIcon("🏬");
const homeIcon = pinIcon("🏠");
const riderIcon = pinIcon("🛵");

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    orderApi.get(id).then(setOrder);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const data = await orderApi.tracking(id);
        if (cancelled) return;
        setTracking(data);
        if (data.status !== "DELIVERED" && data.status !== "CANCELLED") {
          timer = setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!tracking || !order) {
    return <main className="page-container"><p>Loading order...</p></main>;
  }

  const currentIndex = STATUS_STEPS.indexOf(tracking.status);
  const riderPosition = [tracking.currentLat ?? tracking.storeLat, tracking.currentLng ?? tracking.storeLng];
  const center = [(tracking.storeLat + tracking.destLat) / 2, (tracking.storeLng + tracking.destLng) / 2];

  return (
    <main className="page-container">
      <h1>Order #{order.id}</h1>
      <p className="cart-store-name">From {order.storeName}</p>

      <div className="status-timeline">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className={`status-step${i <= currentIndex ? " done" : ""}`}>
            <div className="status-dot" />
            <span>{STATUS_LABELS[step]}</span>
          </div>
        ))}
      </div>

      <div className="map-wrap">
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: "420px", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[tracking.storeLat, tracking.storeLng]} icon={storeIcon}>
            <Popup>{order.storeName}</Popup>
          </Marker>
          <Marker position={[tracking.destLat, tracking.destLng]} icon={homeIcon}>
            <Popup>Delivery address</Popup>
          </Marker>
          {tracking.status === "OUT_FOR_DELIVERY" && (
            <Marker position={riderPosition} icon={riderIcon}>
              <Popup>Your delivery</Popup>
            </Marker>
          )}
          <Polyline
            positions={[[tracking.storeLat, tracking.storeLng], [tracking.destLat, tracking.destLng]]}
            pathOptions={{ color: "#6ec9b5", dashArray: "6 8" }}
          />
        </MapContainer>
      </div>

      <div className="order-items-summary">
        {order.items.map((item) => (
          <div key={item.productId} className="order-item-row">
            <span>{item.quantity} × {item.productName}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        {(() => {
          const lineTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const bogoSavings = lineTotal - order.subtotal;
          return (
            <>
              {bogoSavings > 0.001 && (
                <div className="cart-subtotal-row cart-savings-row">
                  <span>Buy 1 Get 1 savings</span>
                  <span>-${bogoSavings.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="cart-subtotal-row cart-savings-row">
                  <span>First order discount</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </>
          );
        })()}
        <div className="cart-subtotal-row">
          <span>Delivery fee</span>
          <span>{order.deliveryFee === 0 ? "FREE" : `$${order.deliveryFee.toFixed(2)}`}</span>
        </div>
        <div className="cart-total-row">
          <span>Total</span>
          <strong>${order.totalAmount.toFixed(2)}</strong>
        </div>
      </div>
    </main>
  );
}
