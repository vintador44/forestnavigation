import YandexMap from "./../components/YandexMap";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [cordElevation, setCordElevation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const lastRequestRef = useRef(0);
  const navigate = useNavigate();

  const addLocation = useRef(null);
  const removeLocations = useRef(null);

  const handleMapLoad = (addLocFn, removeLocFn) => {
    addLocation.current = addLocFn;
    removeLocations.current = removeLocFn;

    showLocations();
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
      removeLocations.current();
      value.locations.forEach((loc) => {
        addLocation.current(loc.LocationName,
          loc.Description,
          loc.Coordinates);
      });
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

      const data = response.json();

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
      <div style={{ position: 'relative', width: '100%' }}>
        <YandexMap
          onMapLoad={handleMapLoad}
          onCoordinatesChange={handleCoordinatesChange} 
          onElevationChange={handleCordElevationChange} 
        />
        
        
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
            <strong>Высота над уровнем моря:</strong>{" "}
            {isLoading ? "Загрузка..." : cordElevation !== null ? `${cordElevation.toFixed(2)} метров` : "—"}
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