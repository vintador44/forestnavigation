import YandexMap from "./../components/YandexMap";
import { useState, useRef } from "react";

const MainPage = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [cordElevation, setCordElevation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastRequestRef = useRef(0);

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

  return (
    <div className="main-page" style={{ width: "50%", justifyContent: "center" }}>
      <div style={{ padding: "10px", marginBottom: "10px" }}>
        <div><strong>Широта:</strong> {coordinates?.[0]?.toFixed(5) ?? "Null"}</div>
        <div><strong>Долгота:</strong> {coordinates?.[1]?.toFixed(5) ?? "Null"}</div>
        <div>
          <strong>Высота над уровнем моря:</strong>{" "}
          {isLoading ? (
            "Загрузка..."
          ) : cordElevation !== null ? (
            `${cordElevation.toFixed(2)} метров`
          ) : (
            "—"
          )}
        </div>
        
        {error && (
          <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
            Ошибка: {error}
          </div>
        )}
        
        
      </div>
      <YandexMap 
        onCoordinatesChange={handleCoordinatesChange} 
        onElevationChange={handleCordElevationChange} 
      />
    </div>
  );
};

export default MainPage;