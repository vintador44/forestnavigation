import React, { useEffect, useRef, useState } from 'react';

const YandexMap = () => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let script;

    // Функция инициализации карты
    const initMap = () => {
      window.ymaps.ready(() => {
        try {
          new window.ymaps.Map(mapRef.current, {
            center: [55.7558, 37.6173],
            zoom: 10
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to create map:', error);
          setIsLoading(false);
        }
      });
    };

    // Проверяем, загружены ли Яндекс Карты
    if (window.ymaps) {
      initMap();
    } else {
      // Загружаем скрипт
      script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=70d414d5-4c65-4009-8b4f-813f0d72c70c&lang=ru_RU';
      script.async = true;
      
      script.onload = initMap;
      script.onerror = () => {
        console.error('Failed to load Yandex Maps');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    }

    // Очистка
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          zIndex: 1
        }}>
          Загрузка карты...
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s'
        }} 
      />
    </div>
  );
};

export default YandexMap;