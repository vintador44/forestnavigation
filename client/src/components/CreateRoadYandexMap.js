import React, { useEffect, useRef, useState } from "react";

const YandexMap = ({ onCoordinatesChange, permanentPoints = [], routeTrack = [], routeWeather = [] }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);

  useEffect(() => {
    const initMap = () => {
      if (!window.ymaps) {
        console.error('Yandex Maps API not loaded');
        return;
      }

      window.ymaps.ready(() => {
        try {
          const newMap = new window.ymaps.Map(mapRef.current, {
            center: [53.7571, 87.135],
            zoom: 11,
            controls: ["zoomControl", "fullscreenControl", "typeSelector", "geolocationControl", "rulerControl"],
          });

          // ЛКМ — выбор точки
          newMap.events.add("click", (e) => {
            const coords = e.get("coords");
            onCoordinatesChange(coords);

            if (tempMarker) {
              newMap.geoObjects.remove(tempMarker);
              setTempMarker(null);
            }

            const placemark = new window.ymaps.Placemark(coords, {}, {
              preset: "islands#redIcon",
            });

            newMap.geoObjects.add(placemark);
            setTempMarker(placemark);
          });

          setMap(newMap);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      });
    };

    if (!window.ymaps) {
      const script = document.createElement("script");
      script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
      script.async = true;
      script.onload = initMap;
      script.onerror = () => console.error('Failed to load Yandex Maps API');
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (map) {
        map.destroy();
      }
    };
  }, []);

  // Обновление точек и маршрута
  useEffect(() => {
    if (!map) return;
    
    try {
      // Очищаем карту
      map.geoObjects.removeAll();

      // Добавляем основные точки
      permanentPoints.forEach((coords, i) => {
        const weatherInfo = routeWeather.find(w => w.point_index === i);
        let balloonContent = `Точка ${i + 1}`;
        
        if (weatherInfo && weatherInfo.weather) {
          balloonContent += `<br/>⏱️ ${new Date(weatherInfo.estimated_time).toLocaleTimeString('ru-RU')}`;
          balloonContent += `<br/>🌡️ ${weatherInfo.weather.temperature}°C`;
        }

        const pm = new window.ymaps.Placemark(
          coords,
          { 
            balloonContent: balloonContent,
            iconCaption: `Точка ${i + 1}`
          },
          { 
            preset: "islands#blueIcon"
          }
        );
        map.geoObjects.add(pm);
      });

      // Добавляем временную точку
      if (tempMarker) {
        map.geoObjects.add(tempMarker);
      }

      // Создаём линию между основными точками
      if (permanentPoints.length > 1) {
        const line = new window.ymaps.Polyline(
          permanentPoints,
          {},
          {
            strokeColor: "#1E90FF",
            strokeWidth: 3,
          }
        );
        map.geoObjects.add(line);
      }

      // Отрисовываем детальный трек маршрута
      if (routeTrack.length > 1) {
        const trackCoordinates = routeTrack.map(point => [point.lat, point.lng]);
        const routeLine = new window.ymaps.Polyline(
          trackCoordinates,
          {},
          {
            strokeColor: "#00FF00",
            strokeWidth: 2,
          }
        );
        map.geoObjects.add(routeLine);
      }

    } catch (error) {
      console.error('Error updating map:', error);
    }
  }, [map, permanentPoints, tempMarker, routeTrack, routeWeather]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "55%",
      }}
    />
  );
};

export default YandexMap;