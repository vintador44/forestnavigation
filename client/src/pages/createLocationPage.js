import YandexMap from "../components/YandexMap";
import "../styles/CreateLocationPage.css";
import { useCallback } from 'react';
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import ImageCollection from "../components/ImageCollection";
import { API_KEYS } from "../utils/consts";

const CreateLocationPage = () => {
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [coordinates, setCoordinates] = useState(null);
  const [displayCoordinates, setDisplayCoordinates] = useState(null);
  const [elevation, setElevation] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const photoCollectionRef = useRef(null);
  const API_BASE_URL = API_KEYS.API_URL;

  const handleMapLoad = useCallback((addLocation, removeLocations) => {
    console.log('Карта загружена');
  }, []);

  const handleCoordinatesChange = useCallback((coords) => {
    if (coords && coords.length === 2) {
      setDisplayCoordinates(coords);
    }
  }, []);

  const handleMapClick = useCallback(async (coords) => {
    if (!coords || coords.length !== 2) return;

    console.log("Клик по карте, координаты:", coords);

    setCoordinates(coords);
    setDisplayCoordinates(coords);

    try {
      const [lng, lat] = coords;
      const response = await fetch(
        `${API_BASE_URL}/elevation?lat=${lat}&lng=${lng}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setElevation(data.elevation);
        } else {
          setElevation(null);
        }
      } else {
        setElevation(null);
      }
    } catch (error) {
      console.error("Error fetching elevation:", error);
      setElevation(null);
    }
  }, [API_BASE_URL]);

  const handleUpload = useCallback((index, onFileSelect) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой (макс. 5 МБ)");
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Разрешены только JPG, PNG, WebP");
        return;
      }

      onFileSelect(file);
      input.remove();
    };

    input.click();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordinates) {
      alert("Пожалуйста, выберите точку на карте");
      return;
    }

    if (!locationName.trim()) {
      alert("Пожалуйста, введите название локации");
      return;
    }

    if (!description.trim()) {
      alert("Пожалуйста, введите описание локации");
      return;
    }

    if (selectedCategories.length === 0) {
      alert("Пожалуйста, выберите хотя бы одну категорию");
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const locationData = {
        LocationName: locationName.trim(),
        Coordinates: coordinates,
        Description: description.trim(),
        Categories: selectedCategories.map((cat) => cat.name).join(", "),
      };

      console.log("Отправка данных локации:", locationData);

      const locResponse = await fetch(`${API_BASE_URL}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(locationData),
      });

      console.log("Response status (локация):", locResponse.status);

      const locContentType = locResponse.headers.get("content-type");
      if (!locContentType || !locContentType.includes("application/json")) {
        const text = await locResponse.text();
        console.log("Non-JSON response (локация):", text);
        throw new Error(`Server returned non-JSON response: ${locContentType}`);
      }

      const locResult = await locResponse.json();
      console.log("Response data (локация):", locResult);

      if (!locResponse.ok) {
        throw new Error(
          locResult.error || `HTTP error! status: ${locResponse.status}`
        );
      }

      if (!locResult.success) {
        throw new Error(locResult.error || "Failed to create location");
      }

      const locationId = locResult.location.ID;

      const files = photoCollectionRef.current?.getFiles() || [];
      if (files.length > 0) {
        console.log(`Загрузка ${files.length} фото для locationId=${locationId}`);
        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));
        formData.append('locationId', locationId);
        formData.append('userId', '1');

        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        console.log("Upload result:", uploadResult);

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || "Ошибка загрузки фото");
        }
      }

      setSubmitSuccess(true);
      photoCollectionRef.current?.clear();
      resetForm();
      setTimeout(() => setSubmitSuccess(false), 5000);

    } catch (err) {
      console.error("Error creating location or uploading photos:", err);
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setLocationName("");
    setDescription("");
    setSelectedCategories([]);
    setCoordinates(null);
    setDisplayCoordinates(null);
    setElevation(null);
  };

  const toggleCategory = (category) => {
    if (selectedCategories.some((c) => c.id === category.id)) {
      setSelectedCategories(
        selectedCategories.filter((c) => c.id !== category.id)
      );
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const retryFetchCategories = () => {
    setError(null);
    setLoading(true);
    const fetchCategories = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(
          `${API_BASE_URL}/categories?t=${timestamp}`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response: ${contentType}`);
        }

        const data = await response.json();

        if (data.success) {
          const formattedCategories = data.categories.map((cat) => ({
            id: cat.id,
            name: cat.CategoryName,
          }));
          setAvailableCategories(formattedCategories);
        } else {
          throw new Error(data.error || "Failed to load categories");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const timestamp = new Date().getTime();
        const response = await fetch(
          `${API_BASE_URL}/categories?t=${timestamp}`,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.log("Non-JSON response:", text.substring(0, 200));
          throw new Error(`Server returned non-JSON response: ${contentType}`);
        }

        const data = await response.json();
        console.log("Categories data:", data);

        if (data.success) {
          const formattedCategories = data.categories.map((cat) => ({
            id: cat.id,
            name: cat.CategoryName,
          }));

          setAvailableCategories(formattedCategories);
        } else {
          throw new Error(data.error || "Failed to load categories");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
        setAvailableCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  if (loading) {
    return (
      <div className="create-location-container">
        <div className="create-location-loading">Загрузка категорий...</div>
      </div>
    );
  }

  if (error && !submitLoading) {
    return (
      <div className="create-location-container">
        <div className="create-location-error">
          <p>Ошибка при загрузке категорий</p>
          <p style={{ fontSize: "12px", color: "#666" }}>{error}</p>
          <button
            onClick={retryFetchCategories}
            className="create-location-button-primary"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-location-container">
      {error && (
        <div className="create-location-error-message">
          Ошибка при создании локации: {error}
        </div>
      )}

      <div className="create-location-map-container">
        <YandexMap
          onMapLoad={handleMapLoad}
          onCoordinatesChange={handleCoordinatesChange}
          onMapClick={handleMapClick}
        />
        <div className="create-location-map-hint">
          Нажмите на карту, чтобы выбрать локацию
        </div>
      </div>

      {displayCoordinates && (
        <div className="create-location-coordinates-info">
          <p>
            <strong>Координаты:</strong> {displayCoordinates[0].toFixed(6)},{" "}
            {displayCoordinates[1].toFixed(6)}
          </p>
        </div>
      )}

      <ImageCollection
        ref={photoCollectionRef}
        uploadHandler={handleUpload}
      />

      <form onSubmit={handleSubmit} className="create-location-form">
        <div className="create-location-form-group">
          <label htmlFor="locationName" className="create-location-label">
            Название локации *
          </label>
          <input
            id="locationName"
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="create-location-input"
            placeholder="Введите название локации..."
            required
          />
        </div>

        <div className="create-location-form-group">
          <label htmlFor="description" className="create-location-label">
            Описание *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="create-location-textarea"
            placeholder="Введите описание достопримечательности..."
            required
          />
        </div>

        <div className="create-location-grid">
          <div>
            <label className="create-location-label">
              Выберите категории *
            </label>
            <div className="create-location-categories-container">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.some(
                  (c) => c.id === category.id
                );
                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category)}
                    className={`create-location-category-item ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    {category.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="create-location-label">
              Выбранные категории:
            </label>
            <div className="create-location-selected-categories">
              {selectedCategories.length > 0 ? (
                <div>
                  {selectedCategories.map((cat) => (
                    <span key={cat.id} className="create-location-category-tag">
                      {cat.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="create-location-empty-categories">
                  Нет выбранных категорий
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="create-location-buttons-container">
          <button
            type="submit"
            className="create-location-button-primary"
            disabled={
              submitLoading ||
              !coordinates ||
              !locationName.trim() ||
              !description.trim() ||
              selectedCategories.length === 0
            }
          >
            {submitLoading ? "Создание..." : "Создать локацию"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLocationPage;