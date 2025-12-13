import React, { useState, useEffect } from 'react';
import YandexMap from "../components/YandexMap";
import '../styles/ViewLocationPage.css';

import { useParams, useNavigate } from 'react-router-dom';

const ViewLocationPage = () => {
  const { location } = useParams() || -1;

  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleMapLoad = (addLocationFn, _2, _3, _4) => {
    addLocationFn(locationName, description, coordinates, -1, true);
  }

  // Загрузка данных с сервера
  useEffect(() => {
    const fetchLocationData = async() => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:5000/api/locations/${location}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Error while fetching locations data: ${response.status}`);
        }

        const loc = data.location;
        setLocationName(loc.LocationName);
        setDescription(loc.Description);
        setCoordinates(loc.Coordinates);
        setCategories(loc.Categories.split(' '));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    fetchLocationData();
  }, []);

  if (loading) {
    return (
      <div id="view-location-container">
        <div id="view-location-loading">
          Загрузка...
        </div>
      </div>
    );
  }

  if (error) {
    navigate('/MainPage');
    return (<div></div>);
  }

  return (
    <div id="view-location-container">
      {/* Карта */}
      <div id="view-location-map-container">
        <YandexMap
          onMapLoad={handleMapLoad}
          onCoordinatesChange={() => {}}
          onMapClick={() => {}}
        />
      </div>

      {/* Название локации */}
      <h1 id="view-location-header">
        {locationName}
      </h1>

      <div id="view-location-data-container">
        {/* Описание */}
        <p id="view-location-desc">
          {description}
        </p>

        {/* Координаты и высота */}
        <div id="view-location-coordinates-info">
          <p><strong>Координаты:</strong> {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}</p>
        </div>

        <hr></hr>

        {/* Категории */}
        <div>
          <h6 className="view-location-label">Категории:</h6>
          <div id="view-location-categories">
            {categories.length > 0 ? (
              <div>
                {categories.map(cat => (
                  <span key={cat} className="view-location-category-tag">
                    {cat}
                  </span>
                ))}
              </div>
            ) : (
              <p id="view-location-empty-categories">
                Нет категорий
              </p>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div id="view-location-buttons-container">
          <button
            className="view-location-button"
            onClick={(_) => navigate('/MainPage')}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewLocationPage;