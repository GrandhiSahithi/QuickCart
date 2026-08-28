import { useState } from "react";
import { useLocationContext } from "../context/LocationContext";

export default function LocationPicker() {
  const { location, loading, error, setFromZip, useDeviceLocation, clearLocation } = useLocationContext();
  const [open, setOpen] = useState(false);
  const [zip, setZip] = useState("");

  async function handleZipSubmit(e) {
    e.preventDefault();
    if (zip.trim()) {
      await setFromZip(zip.trim());
      setOpen(false);
    }
  }

  function handleUseLocation() {
    useDeviceLocation();
    setOpen(false);
  }

  return (
    <div className="location-picker">
      <button type="button" className="location-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="location-trigger-icon">📍</span>
        <span className="location-trigger-text">
          <strong>{location ? location.label : loading ? "Detecting your location…" : "Set delivery location"}</strong>
          <span>{location ? "Tap to change" : "Click here to enter a ZIP code"}</span>
        </span>
        <span className="location-trigger-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="location-popover">
          <p className="location-popover-title">Where should we deliver?</p>

          <form onSubmit={handleZipSubmit}>
            <input placeholder="Enter ZIP code" value={zip} onChange={(e) => setZip(e.target.value)} maxLength={5} autoFocus />
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "..." : "Set"}
            </button>
          </form>

          <button type="button" className="location-option-button" onClick={handleUseLocation} disabled={loading}>
            📍 Use my current location
          </button>

          {location && (
            <button
              type="button"
              className="location-option-button location-clear"
              onClick={() => {
                clearLocation();
                setOpen(false);
              }}
            >
              ✕ Clear location
            </button>
          )}

          {error && <p className="error-text field-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
