import { createContext, useContext, useEffect, useState } from "react";

const LocationContext = createContext(null);
const LOCATION_KEY = "quickcart_location";

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    try {
      const raw = localStorage.getItem(LOCATION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(LOCATION_KEY);
    }
  }, [location]);

  async function setFromZip(zip) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("Invalid ZIP code");
      const data = await res.json();
      const place = data.places[0];
      setLocation({
        lat: parseFloat(place.latitude),
        lng: parseFloat(place.longitude),
        label: `${place["place name"]}, ${place["state abbreviation"]} ${zip}`
      });
    } catch {
      setError("Couldn't find that ZIP code.");
    } finally {
      setLoading(false);
    }
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setError("Location access isn't available in this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let label = "Current location";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village;
          const state = data.address?.state;
          if (city && state) label = `${city}, ${state}`;
        } catch {
          // Keep the generic label if reverse geocoding fails.
        }
        setLocation({ lat: latitude, lng: longitude, label });
        setLoading(false);
      },
      () => {
        setError("Couldn't access your location. Check your browser permissions.");
        setLoading(false);
      }
    );
  }

  function clearLocation() {
    setLocation(null);
  }

  return (
    <LocationContext.Provider value={{ location, loading, error, setFromZip, useDeviceLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
