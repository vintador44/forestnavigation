import React, { useEffect, useRef, useState } from "react";

const YandexMap = ({ onCoordinatesChange, onElevationChange }) => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let script;
    let isMounted = true;

    const initMap = () => {
      if (!isMounted) return;

      window.ymaps.ready(() => {
        if (!isMounted) return;

        try {
          if (!mapInstanceRef.current) {
            const map = new window.ymaps.Map(mapRef.current, {
              center: [53.7571, 87.135],
              zoom: 10,
              controls: [
                "zoomControl",
                "fullscreenControl",
                "typeSelector",
                "geolocationControl",
                "rulerControl",
              ],
            });

            mapInstanceRef.current = map;

            map.events.add("mousemove", (e) => {
              const coords = e.get("coords");
              if (onCoordinatesChange) {
                onCoordinatesChange(coords);
              }
            });

            map.events.add("click", (e) => {
              const coords = e.get("coords");

              if (onCoordinatesChange) {
                onCoordinatesChange(coords);
              }

              if (onElevationChange) {
                onElevationChange(coords[0], coords[1]);
              }

              const placemark = new window.ymaps.Placemark(coords, {
                balloonContent: `Координаты: ${coords[0].toFixed(
                  6
                )}, ${coords[1].toFixed(6)}`,
              });

              map.geoObjects.removeAll();
              map.geoObjects.add(placemark);
            });

            setIsLoading(false);
          }
        } catch (error) {
          console.error("Failed to create map:", error);
          setIsLoading(false);
        }
      });
    };

    if (window.ymaps) {
      initMap();
    } else {
      script = document.createElement("script");
      script.src =
        "https://api-maps.yandex.ru/2.1/?apikey=70d414d5-4c65-4009-8b4f-813f0d72c70c&lang=ru_RU";
      script.async = true;

      script.onload = initMap;
      script.onerror = () => {
        console.error("Failed to load Yandex Maps");
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      style={{
        paddingTop: "20px",
        width: "100%",
        height: "70vh",
        position: "relative",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5",
            zIndex: 1,
          }}
        >
          Загрузка карты...
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s",
        }}
      />
    </div>
  );
};

export default YandexMap;
