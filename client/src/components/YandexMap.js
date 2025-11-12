import React, { useEffect, useRef, useState } from "react";

const YandexMap = ({onMapLoad, onCoordinatesChange, onMapClick}) => { // Изменили onElevationChange на onMapClick
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapInstanceRef = useRef(null);

  const lastPlacemark = useRef(null);
  const routeObjects = useRef([]);

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
              console.log('Клик по карте YandexMap:', coords); // Добавляем логирование

              if (onCoordinatesChange) {
                onCoordinatesChange(coords);
              }

              // ВЫЗЫВАЕМ onMapClick вместо onElevationChange
              if (onMapClick) {
                onMapClick(coords);
              }

              const placemark = new window.ymaps.Placemark(coords, {
                balloonContent: `Координаты: ${coords[0].toFixed(
                  6
                )}, ${coords[1].toFixed(6)}`,
              });

              if (lastPlacemark.current)
                map.geoObjects.remove(lastPlacemark.current);

              map.geoObjects.add(placemark);
              lastPlacemark.current = placemark;
            });

            setIsLoading(false);

            const addLocation = (title, desc, coords) => {
              const marker = new window.ymaps.Placemark(coords, {
                hintContent: title,
                balloonContentHeader: title,
                balloonContent: desc,
                balloonContentFooter: `Координаты: ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`
              }, {
                preset: 'islands#redDotIcon'
              });
              map.geoObjects.add(marker);
            }

            const removeLocations = () => {
              const objectsToRemove = [];
              map.geoObjects.each((obj) => {
                if (obj !== lastPlacemark.current && !routeObjects.current.includes(obj)) {
                  objectsToRemove.push(obj);
                }
              });
              objectsToRemove.forEach(obj => map.geoObjects.remove(obj));
            }

            const addRoute = (coordinates, name, description, complexity) => {
              const routeLine = new window.ymaps.Polyline(coordinates, {}, {
                strokeColor: '#1e88e5',
                strokeWidth: 4,
                strokeOpacity: 0.7
              });

              const startPlacemark = new window.ymaps.Placemark(coordinates[0], {
                hintContent: name,
                balloonContentHeader: name,
                balloonContent: `${description}<br>Сложность: ${complexity}<br>Начало маршрута`
              }, {
                preset: 'islands#greenCircleIcon'
              });

              const endPlacemark = new window.ymaps.Placemark(coordinates[coordinates.length - 1], {
                hintContent: name,
                balloonContent: `Конец маршрута: ${name}`
              }, {
                preset: 'islands#redCircleIcon'
              });

              map.geoObjects.add(routeLine);
              map.geoObjects.add(startPlacemark);
              map.geoObjects.add(endPlacemark);

              routeObjects.current.push(routeLine, startPlacemark, endPlacemark);
            }

            const removeRoutes = () => {
              routeObjects.current.forEach(obj => {
                map.geoObjects.remove(obj);
              });
              routeObjects.current = [];
            }

            onMapLoad(addLocation, removeLocations, addRoute, removeRoutes);
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
  }, [onMapLoad, onCoordinatesChange, onMapClick]); // Добавляем зависимости

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
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