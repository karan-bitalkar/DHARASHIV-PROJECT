import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useOrders } from '../OrderContext';
import 'leaflet/dist/leaflet.css';
import './TrackingPage.css';

const START_POSITION = [18.5793, 73.7484];
const END_POSITION = [18.5204, 73.8567];
const SIMULATED_ROUTE_KM = 5.2;
const TRACKING_INTERVAL_MS = 2500;
const STATUS_STEPS = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const partnerIcon = L.divIcon({
  className: 'tracking-marker-icon',
  html: '<span class="tracking-scooter-marker" aria-label="Delivery partner location">●</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const destinationIcon = L.divIcon({
  className: 'tracking-marker-icon',
  html: '<span class="tracking-destination-marker" aria-label="Delivery address"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const getPositionAtProgress = (progress) => [
  START_POSITION[0] + (END_POSITION[0] - START_POSITION[0]) * progress,
  START_POSITION[1] + (END_POSITION[1] - START_POSITION[1]) * progress
];

const MapViewport = ({ destination }) => {
  const map = useMap();

  useEffect(() => {
    map.fitBounds([START_POSITION, destination], { padding: [48, 48] });
  }, [destination, map]);

  return null;
};

const StatusTimeline = ({ activeStep }) => (
  <ol className="tracking-timeline">
    {STATUS_STEPS.map((step, index) => {
      const isComplete = index <= activeStep;
      return (
        <li className={`tracking-timeline-step${isComplete ? ' is-complete' : ''}`} key={step}>
          <span className="tracking-timeline-marker" aria-hidden="true">
            {isComplete ? '✓' : ''}
          </span>
          <span className="tracking-timeline-label">{step}</span>
          {index < STATUS_STEPS.length - 1 && <span className="tracking-timeline-connector" aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

const TrackingPage = () => {
  const { orderId } = useParams();
  const { orders } = useOrders();
  const order = orders.find((item) => item.id === orderId);
  const [progress, setProgress] = useState(0.06);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const dragStartY = useRef(null);
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const address = order?.address;
  const destination = END_POSITION;
  const partnerPosition = useMemo(() => getPositionAtProgress(progress), [progress]);
  const remainingKm = Math.max(0, SIMULATED_ROUTE_KM * (1 - progress));
  const activeStep = order?.status === 'Cancelled'
    ? -1
    : ({ 'Order Placed': 0, Pending: 0, Processing: 1, Shipped: 2, 'Out for Delivery': 3, Delivered: 4 }[order?.status] ?? order?.statusIndex ?? 0);
  const routeLine = [partnerPosition, destination];
  const formattedAddress = address
    ? [address.addressLine, address.city, address.state, address.pincode]
      .filter((part, index, parts) => part && !parts.slice(0, index).some((previous) => (
        previous.toLowerCase().includes(part.toLowerCase())
      )))
      .join(', ')
    : 'Delivery address unavailable';

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setProgress((current) => Math.min(1, current + 0.025));
    }, TRACKING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleSheetPointerDown = (event) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSheetPointerUp = (event) => {
    if (dragStartY.current === null) return;
    const dragDistance = dragStartY.current - event.clientY;
    if (Math.abs(dragDistance) > 24) {
      setIsSheetExpanded(dragDistance > 0);
    } else {
      setIsSheetExpanded((expanded) => !expanded);
    }
    dragStartY.current = null;
  };

  if (!order) {
    return (
      <section className="tracking-not-found">
        <div className="tracking-not-found-card">
          <span className="tracking-not-found-icon" aria-hidden="true">!</span>
          <h1>We couldn't find this order</h1>
          <p>Check the order number or return to My Orders to select an order to track.</p>
          <Link className="tracking-back-button" to="/orders">Back to My Orders</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="tracking-page" aria-label={`Live tracking for order ${order.id}`}>
      <div className="tracking-map-panel">
        <MapContainer
          center={START_POSITION}
          zoom={13}
          zoomControl={false}
          scrollWheelZoom
          className="tracking-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport destination={destination} />
          <ZoomControl position="topright" />
          <Polyline positions={routeLine} pathOptions={{ color: '#3E2723', weight: 5, opacity: 0.82 }} />
          <Marker position={partnerPosition} icon={partnerIcon} />
          <Marker position={destination} icon={destinationIcon} />
        </MapContainer>
        <Link className="tracking-map-back" to="/orders" aria-label="Back to My Orders">
          <span aria-hidden="true">←</span> <span className="tracking-map-back-label">My Orders</span>
        </Link>
        <div className="tracking-map-badge">
          <span className="tracking-live-dot" />
          SIMULATED LIVE LOCATION
        </div>
        <div className="tracking-map-legend" aria-label="Map legend">
          <span><i className="tracking-legend-partner" /> Partner</span>
          <span><i className="tracking-legend-destination" /> Destination</span>
        </div>
      </div>

      <aside
        className={`tracking-details-panel${isSheetExpanded ? ' is-expanded' : ''}`}
        aria-label="Tracking and order details"
      >
        <div
          className="tracking-sheet-handle"
          onPointerDown={handleSheetPointerDown}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={() => { dragStartY.current = null; }}
          role="button"
          tabIndex={0}
          aria-label={isSheetExpanded ? 'Collapse tracking details' : 'Expand tracking details'}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsSheetExpanded((expanded) => !expanded);
            }
          }}
        >
          <span className="tracking-sheet-grabber" />
        </div>

        <div className="tracking-details-scroll">
          <header className="tracking-details-header">
            <div>
              <p className="tracking-eyebrow">ORDER #{order.id}</p>
              <h1>Track your delivery</h1>
            </div>
            <span className="tracking-live-status"><i /> {order.status || 'Order Placed'}</span>
          </header>

          <section className="tracking-eta-card" aria-live="polite">
            <div>
              <p className="tracking-eyebrow">ESTIMATED ARRIVAL</p>
              <strong>{order.status === 'Delivered' ? 'Delivered' : order.status || 'Order Placed'}</strong>
            </div>
            <div className="tracking-distance">
              <span>{remainingKm.toFixed(1)} km</span>
              <small>remaining</small>
            </div>
          </section>

          <section className="tracking-section">
            <h2>Delivery progress</h2>
            <StatusTimeline activeStep={activeStep} />
            {order.status === 'Cancelled' && <p className="tracking-map-disclaimer">This order has been cancelled.</p>}
            {order.trackingId && (
              <p className="tracking-map-disclaimer">Tracking ID: <strong>{order.trackingId}</strong></p>
            )}
          </section>

          <section className="tracking-partner-card">
            <div className="tracking-partner-avatar" aria-label="Delivery partner photo">
              <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
                <circle cx="32" cy="32" r="32" fill="#F8F3E8" />
                <path d="M12 59c2-12 9-18 20-18s18 6 20 18" fill="#F58220" />
                <circle cx="32" cy="26" r="12" fill="#3E2723" />
                <path d="M20 25c1-10 7-15 13-15 7 0 12 5 13 14-4-1-8-4-10-7-3 4-9 7-16 8Z" fill="#3E2723" />
                <path d="M27 29c1 1 2 1 5 1s4 0 5-1" fill="none" stroke="#F8F3E8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="tracking-partner-info">
              <p className="tracking-eyebrow">YOUR DELIVERY PARTNER</p>
              <h2>Rahul Sharma <span>★ 4.8</span></h2>
              <p>Scooter · MH-12-AB-1234</p>
            </div>
            <div className="tracking-partner-actions">
              <a href="tel:+919876543210" aria-label="Call Rahul Sharma">
                <span aria-hidden="true">☎</span><span>Call</span>
              </a>
              <a href="sms:+919876543210" aria-label="Message Rahul Sharma">
                <span aria-hidden="true">✉</span><span>Message</span>
              </a>
            </div>
          </section>

          <section className="tracking-section tracking-delivery-address">
            <h2>Delivering to</h2>
            <p className="tracking-address-name">{address?.name || 'Customer'}</p>
            <p>{formattedAddress}</p>
            <p className="tracking-map-disclaimer">The map route uses demo coordinates; this is not GPS tracking.</p>
          </section>

          <section className="tracking-section tracking-order-summary">
            <h2>Order summary <span>{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span></h2>
            <ul>
              {orderItems.map((item, index) => (
                <li key={`${item.id || item.name}-${index}`}>
                  <span>{item.name} <small>{item.weight ? `· ${item.weight}` : ''} × {item.quantity || 1}</small></span>
                  <strong>₹{Number(item.finalPrice || 0) * Number(item.quantity || 1)}</strong>
                </li>
              ))}
            </ul>
            <div className="tracking-order-total">
              <span>Total paid</span>
              <strong>₹{Number(order.pricing?.grandTotal || 0).toFixed(2)}</strong>
            </div>
          </section>
        </div>
      </aside>
    </section>
  );
};

export default TrackingPage;
