import YandexMap from "./../components/YandexMap";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [cordElevation, setCordElevation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roads, setRoads] = useState([]);
  const lastRequestRef = useRef(0);
  const navigate = useNavigate();

  const addLocation = useRef(null);
  const removeLocations = useRef(null);
  const addRoute = useRef(null);
  const removeRoutes = useRef(null);

  // Загрузка маршрутов при монтировании
  useEffect(() => {
    loadRoads();
  }, []);

  // Показываем маршруты на карте когда данные загружены или обновлены
  useEffect(() => {
    if (roads.length > 0 && addRoute.current) {
      showRoadsOnMap();
    }
  }, [roads, addRoute.current]); // Добавляем зависимость от roads и addRoute.current

  const handleMapLoad = (addLocFn, removeLocFn, addRouteFn, removeRouteFn) => {
    addLocation.current = addLocFn;
    removeLocations.current = removeLocFn;
    addRoute.current = addRouteFn;
    removeRoutes.current = removeRouteFn;

    showLocations();
    // Показываем маршруты если они уже загружены
    if (roads.length > 0) {
      showRoadsOnMap();
    }
  }

  const loadRoads = async () => {
    try {
      console.log("Загрузка маршрутов...");
      const response = await fetch('http://localhost:5000/api/roads');
      if (response.ok) {
        const data = await response.json();
        console.log("Получены данные маршрутов:", data);
        if (data.success) {
          setRoads(data.data.roads);
        }
      } else {
        console.error("Ошибка HTTP:", response.status);
      }
    } catch (error) {
      console.error('Error loading roads:', error);
    }
  }

  const showRoadsOnMap = () => {
    if (!addRoute.current || !removeRoutes.current) {
      console.log("Функции карты еще не загружены");
      return;
    }
    
    console.log("Отображение маршрутов на карте:", roads.length);
    removeRoutes.current();
    
    roads.forEach((road, index) => {
      console.log(`Обработка маршрута ${index + 1}:`, road);
      
      // Преобразуем точки маршрута в координаты для отображения
      // === СОРТИРУЕМ ТОЧКИ ПО ПОРЯДКУ МАРШРУТА ===
const sortedDots = sortDotsByOrder(road.dots);

const routeCoordinates = sortedDots.map(dot => {
  if (dot.ThisDotCoordinates?.coordinates) {
    const [lng, lat] = dot.ThisDotCoordinates.coordinates;
    return [lat, lng];
  } else if (typeof dot.ThisDotCoordinates === 'string') {
    const match = dot.ThisDotCoordinates.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      return [lat, lng];
    }
  }
  console.warn("Некорректные координаты:", dot);
  return null;
}).filter(Boolean);

// === Функция сортировки (вставьте её ВНЕ showRoadsOnMap) ===
function sortDotsByOrder(dots) {
  if (!dots || dots.length === 0) return dots;

  // Строим мапу: ThisDot → Dot
  const dotMap = new Map();
  const nextMap = new Map(); // ThisKey → NextKey

  dots.forEach(dot => {
    const thisCoord = getCoordKey(dot.ThisDotCoordinates);
    const nextCoord = dot.NextDotCoordinates ? getCoordKey(dot.NextDotCoordinates) : null;
    
    dotMap.set(thisCoord, dot);
    if (nextCoord) nextMap.set(thisCoord, nextCoord);
  });

  // Находим стартовую точку (её координаты не являются чьим-то Next)
  let startKey = null;
  for (let key of dotMap.keys()) {
    let isStart = true;
    for (let nextKey of nextMap.values()) {
      if (nextKey === key) {
        isStart = false;
        break;
      }
    }
    if (isStart) {
      startKey = key;
      break;
    }
  }

  if (!startKey) startKey = Array.from(dotMap.keys())[0];

  // Собираем маршрут по цепочке
  const ordered = [];
  let currentKey = startKey;

  while (currentKey && dotMap.has(currentKey)) {
    const dot = dotMap.get(currentKey);
    ordered.push(dot);
    currentKey = nextMap.get(currentKey) || null;
  }

  return ordered;
}

// Вспомогательная функция для получения ключа координат
function getCoordKey(coord) {
  if (!coord) return null;
  
  // GeoJSON: { coordinates: [lng, lat] }
  if (coord.coordinates && Array.isArray(coord.coordinates)) {
    return `${coord.coordinates[0].toFixed(6)},${coord.coordinates[1].toFixed(6)}`;
  }
  
  // WKT: "POINT(lng lat)"
  if (typeof coord === 'string') {
    const match = coord.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match) {
      return `${parseFloat(match[1]).toFixed(6)},${parseFloat(match[2]).toFixed(6)}`;
    }
  }
  
  return null;
}

      console.log(`Координаты маршрута ${index + 1}:`, routeCoordinates);

      if (routeCoordinates.length > 1) {
        addRoute.current(
          routeCoordinates,
          road.Name || `Маршрут ${road.ID}`,
          road.Description || 'Без описания',
          road.Complexity || 'Не указана'
        );
        console.log(`Маршрут ${index + 1} добавлен на карту`);
      } else {
        console.warn(`Маршрут ${index + 1} имеет недостаточно точек:`, routeCoordinates.length);
      }
    });
  }

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Поиск:", searchQuery);
    showLocations();
  }

  const handleCoordinatesChange = (newCoordinates) => {
    setCoordinates(newCoordinates);
    setError(null);
  }

  const handleCordElevationChange = (lat, lng) => {
    if (!lat || !lng) {
      setError("Координаты не получены");
      return;
    }
    
    const now = Date.now();
    if (now - lastRequestRef.current < 1000) {
      setError("Подождите немного перед следующим запросом");
      return;
    }
    
    lastRequestRef.current = now;
    getRealElevation(lat, lng);
  }

  const handleCreateLandmark = () => {
    if (!coordinates) {
      setError("Сначала выберите точку на карте");
      return;
    }
    navigate('/create-location', { 
      state: { 
        coordinates: coordinates,
        elevation: cordElevation 
      } 
    });
  }

  const handleCreateRoute = () => {
    navigate('/create-route');
  }

  const showLocations = () => {
    const locations = getLocations(searchQuery);
    locations.then((value) => {
      if (removeLocations.current && addLocation.current) {
        removeLocations.current();
        value.locations.forEach((loc) => {
          addLocation.current(loc.LocationName,
            loc.Description,
            loc.Coordinates);
        });
      }
    });
  }

  async function getRealElevation(lat, lng) {
    if (!lat || !lng) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/elevation?lat=${lat}&lng=${lng}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      if (data.success) {
        setCordElevation(data.elevation);
      } else {
        throw new Error(data.error || 'Failed to get elevation');
      }
      
    } catch (error) {
      console.error('Error fetching elevation:', error);
      setError(error.message);
      setCordElevation(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function getLocations(tagString) {
    console.log(tagString);
    setError(null);

    try {
      const response = await fetch(
        'http://localhost:5000/api/locations' + (tagString ? `?tags=${tagString}` : '')
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting locations:', error);
      setError(error.message);
      return { locations: [] };
    }
  }

  return (
    <div className="main-page">
      <div style={{ position: 'relative', width: '100%' ,height: '80%'}}>
        <YandexMap
          onMapLoad={handleMapLoad}
          onCoordinatesChange={handleCoordinatesChange} 
          onElevationChange={handleCordElevationChange} 
        />
        
        {/* Панель поиска */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '23%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '500px'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тегам"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}
            >
              Найти
            </button>
          </form>
        </div>
      </div>

      <div className="botContainer">
        <button 
          className="action-button"
          onClick={handleCreateLandmark}
          disabled={!coordinates}
        >
          Создать достопримечательность
        </button>
       
        <div className="coordinates-info">
          <div><strong>Широта:</strong> {coordinates?.[0]?.toFixed(5) ?? "Null"}</div>
          <div><strong>Долгота:</strong> {coordinates?.[1]?.toFixed(5) ?? "Null"}</div>
          <div>
           
          </div>
          
          {error && (
            <div className="error-message">
              Ошибка: {error}
            </div>
          )}
        </div>
        
        <button 
          className="action-button"
          onClick={handleCreateRoute}
        >
          Создать маршрут
        </button>
      </div>
    </div>
  );
};

export default MainPage;