package com.quickcart.util;

/**
 * Every seeded store's lat/lng is a small real-world offset from a fixed
 * demo center. When a real viewer location is known (from a real ZIP code
 * geocode or the browser's real GPS), that same offset is re-applied around
 * the viewer's real coordinates - so the store layout, distances, and map
 * are genuine geography anchored wherever the viewer actually is, even
 * though the businesses themselves are demo data.
 */
public final class GeoUtil {

    public static final double DEMO_CENTER_LAT = 37.7749;
    public static final double DEMO_CENTER_LNG = -122.4194;

    private GeoUtil() {
    }

    public static double translateLat(double originalLat, Double viewerLat) {
        return viewerLat == null ? originalLat : viewerLat + (originalLat - DEMO_CENTER_LAT);
    }

    public static double translateLng(double originalLng, Double viewerLng) {
        return viewerLng == null ? originalLng : viewerLng + (originalLng - DEMO_CENTER_LNG);
    }
}
