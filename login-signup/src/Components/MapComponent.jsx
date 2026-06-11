import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,

      // Demo style for testing
      style: "https://demotiles.maplibre.org/style.json",

      center: [-74.006, 40.7128],
      zoom: 13,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      console.log("Map Loaded Successfully");
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <div
        ref={mapContainer}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default MapComponent;