import { useState, useEffect } from "react";
import "./../styles/ViewRoutePanel.css";

const ViewRoutePanel = ({ routeId, onClose, isOpen }) => {
  const [routeData, setRouteData] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [arrivalTimes, setArrivalTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    if (isOpen && routeId) {
      loadRouteData();
    } else {
      setRouteData(null);
      setRouteStats(null);
      setWeatherData({});
      setArrivalTimes([]);
      setError(null);
    }
  }, [isOpen, routeId]);

  const loadRouteData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Загружаем данные маршрута
      const routeResponse = await fetch(`http://localhost:5000/api/roads/${routeId}`);
      
      if (!routeResponse.ok) {
        throw new Error(`HTTP error: ${routeResponse.status}`);
      }
      
      const routeDataJson = await routeResponse.json();
      console.log("Полученные данные маршрута:", routeDataJson);

      if (routeDataJson.success && routeDataJson.data && routeDataJson.data.road) {
        const route = routeDataJson.data.road;
        setRouteData(route);
        
        // 2. Рассчитываем время прибытия в каждую точку
        const times = calculateArrivalTimes(route);
        setArrivalTimes(times);
        
        // 3. Рассчитываем полную статистику маршрута через API
        if (route.dots && route.dots.length >= 2) {
          await calculateRouteStatsWithAPI(route);
          
          // 4. Загружаем прогноз погоды для каждой точки
          await loadWeatherForPoints(route, times);
        }
      } else {
        throw new Error("Не удалось загрузить данные маршрута");
      }
    } catch (err) {
      console.error("Error loading route data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRouteStatsWithAPI = async (route) => {
    try {
      const dots = route.dots;
      let totalStats = {
        total_distance: 0,
        total_difficulty: 0,
        total_climb: 0,
        total_descent: 0
      };
      
      // Проходим по всем сегментам маршрута (между точками)
      for (let i = 0; i < dots.length - 1; i++) {
        const currentDot = dots[i];
        const nextDot = dots[i + 1];
        
        const startCoords = getCoordinatesFromDot(currentDot.ThisDotCoordinates);
        const endCoords = getCoordinatesFromDot(nextDot.ThisDotCoordinates);
        
        if (!startCoords || !endCoords) continue;
        
        // Используем тот же API, что и при создании маршрута
        const segmentStats = await getSegmentStatsFromAPI(
          startCoords.lat,
          startCoords.lng,
          endCoords.lat,
          endCoords.lng,
          route.StartDateTime,
          i,
          dots.length
        );
        
        if (segmentStats) {
          totalStats.total_distance += segmentStats.total_distance || 0;
          totalStats.total_difficulty += segmentStats.total_difficulty || 0;
          totalStats.total_climb += segmentStats.total_climb || 0;
          totalStats.total_descent += segmentStats.total_descent || 0;
        }
        
        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log("Итоговая статистика:", totalStats);
      
      setRouteStats(totalStats);
      
    } catch (error) {
      console.error("Ошибка расчета статистики через API:", error);
      // Если API не работает, используем упрощенный расчет
      calculateSimplifiedStats(route);
    }
  };

  const getSegmentStatsFromAPI = async (startLat, startLng, endLat, endLng, startDateTime, segmentIndex, totalSegments) => {
    try {
      // Расчет длительности сегмента на основе общего времени маршрута
      // Для простоты делим общее время на количество сегментов
      // В реальности нужно учитывать длину каждого сегмента
      const segmentDurationHours = 3; // По умолчанию 3 часа, как в CreateRoadPage
      
      console.log(`Запрос статистики для сегмента ${segmentIndex + 1}:`, {
        startLat, startLng, endLat, endLng, startDateTime, segmentDurationHours
      });
      
      const response = await fetch(
        `http://localhost:5000/api/route/elevations?` +
        `startLat=${startLat}&startLng=${startLng}&` +
        `endLat=${endLat}&endLng=${endLng}&` +
        `startDateTime=${startDateTime}&durationHours=${segmentDurationHours}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Данные сегмента ${segmentIndex + 1}:`, data);
        if (data.success) {
          return data.statistics;
        }
      } else {
        console.error(`Ошибка HTTP для сегмента ${segmentIndex + 1}:`, response.status);
      }
    } catch (error) {
      console.error(`Ошибка получения статистики сегмента ${segmentIndex + 1}:`, error);
    }
    return null;
  };

  const calculateSimplifiedStats = async (route) => {
    try {
      const dots = route.dots;
      let totalDistance = 0;
      let totalClimb = 0;
      let totalDescent = 0;
      
      for (let i = 0; i < dots.length - 1; i++) {
        const currentDot = dots[i];
        const nextDot = dots[i + 1];
        
        const startCoords = getCoordinatesFromDot(currentDot.ThisDotCoordinates);
        if (!startCoords) continue;
        
        const endCoords = getCoordinatesFromDot(nextDot.ThisDotCoordinates);
        if (!endCoords) continue;
        
        const segmentDistance = calculateDistance(
          startCoords.lat,
          startCoords.lng,
          endCoords.lat,
          endCoords.lng
        );
        
        totalDistance += segmentDistance;
        
        // Получаем высоты для расчета подъемов/спусков
        const startElevation = await getElevation(startCoords.lat, startCoords.lng);
        const endElevation = await getElevation(endCoords.lat, endCoords.lng);
        
        if (startElevation !== null && endElevation !== null) {
          const elevationDiff = endElevation - startElevation;
          if (elevationDiff > 0) {
            totalClimb += elevationDiff;
          } else {
            totalDescent += Math.abs(elevationDiff);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Упрощенный расчет сложности (как в CreateRoadPage API)
      // Формула: distance * multiplier (учитывает уклон, погоду и т.д.)
      const simplifiedDifficulty = Math.round(totalDistance * 1.5); // Примерный множитель
      
      setRouteStats({
        total_distance: totalDistance,
        total_difficulty: simplifiedDifficulty,
        total_climb: totalClimb,
        total_descent: totalDescent
      });
      
    } catch (error) {
      console.error("Ошибка упрощенного расчета:", error);
    }
  };

  const calculateArrivalTimes = (route) => {
    if (!route || !route.dots || route.dots.length === 0) return [];
    
    const startTime = new Date(route.StartDateTime);
    const endTime = new Date(route.EndDateTime);
    const totalDurationMs = endTime - startTime;
    
    const pointsCount = route.dots.length;
    const arrivalTimes = [];
    
    // Равномерно распределяем время между точками
    for (let i = 0; i < pointsCount; i++) {
      const fraction = i / (pointsCount - 1);
      const pointTime = new Date(startTime.getTime() + fraction * totalDurationMs);
      arrivalTimes.push(pointTime);
    }
    
    return arrivalTimes;
  };

  const loadWeatherForPoints = async (route, arrivalTimes) => {
    if (!route.dots || route.dots.length === 0 || arrivalTimes.length === 0) return;
    
    setIsWeatherLoading(true);
    const weather = {};
    
    try {
      for (let i = 0; i < route.dots.length; i++) {
        const dot = route.dots[i];
        const coords = getCoordinatesFromDot(dot.ThisDotCoordinates);
        const arrivalTime = arrivalTimes[i];
        
        if (coords && arrivalTime) {
          try {
            const forecast = await getWeatherForecast(coords.lat, coords.lng, arrivalTime);
            if (forecast) {
              weather[dot.ID] = forecast;
            }
          } catch (error) {
            console.error(`Ошибка загрузки погоды для точки ${i + 1}:`, error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setWeatherData(weather);
    } catch (error) {
      console.error("Ошибка загрузки погоды:", error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const getWeatherForecast = async (lat, lng, time) => {
    try {
      const dateTimeStr = time.toISOString().replace('T', ' ').substring(0, 19);
      
      const response = await fetch(
        `http://localhost:5000/api/weather/forecast/range?` +
        `lat=${lat}&lng=${lng}&` +
        `fromDateTime=${dateTimeStr}&` +
        `toDateTime=${dateTimeStr}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.forecast && data.forecast.length > 0) {
          return data.forecast[0];
        }
      }
      
      return await getCurrentWeather(lat, lng);
      
    } catch (error) {
      console.error("Ошибка получения прогноза погоды:", error);
      return await getCurrentWeather(lat, lng);
    }
  };

  const getCurrentWeather = async (lat, lng) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/weather?lat=${lat}&lng=${lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            temperature: data.temperature,
            description: data.description,
            wind: data.wind,
            humidity: data.humidity,
            city: data.city
          };
        }
      }
    } catch (error) {
      console.error("Ошибка получения текущей погоды:", error);
    }
    return null;
  };

  const getCoordinatesFromDot = (coordData) => {
    if (!coordData) return null;
    
    if (coordData.coordinates && Array.isArray(coordData.coordinates)) {
      const [lng, lat] = coordData.coordinates;
      return { lat, lng };
    }
    
    if (typeof coordData === "string") {
      const match = coordData.match(/POINT\(([^ ]+) ([^)]+)\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        return { lat, lng };
      }
    }
    
    return null;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getElevation = async (lat, lng) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/elevation?lat=${lat}&lng=${lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.elevation;
        }
      }
    } catch (error) {
      console.error("Ошибка получения высоты:", error);
    }
    return null;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Не указано";
    
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        return "Неверный формат даты";
      }
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return "Ошибка даты";
    }
  };

  const formatDistance = (meters) => {
    if (!meters || isNaN(meters)) return "0 м";
    
    const metersNum = Number(meters);
    if (metersNum < 1000) {
      return `${Math.round(metersNum)} м`;
    }
    return `${(metersNum / 1000).toFixed(1)} км`;
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null || isNaN(value)) return "0";
    return Math.round(Number(value));
  };

  const getWeatherIcon = (description) => {
    if (!description) return "🌤️";
    
    const desc = description.toLowerCase();
    if (desc.includes("ясно") || desc.includes("солнце")) return "☀️";
    if (desc.includes("облачно") || desc.includes("тучи")) return "☁️";
    if (desc.includes("дождь") || desc.includes("ливень")) return "🌧️";
    if (desc.includes("снег")) return "❄️";
    if (desc.includes("туман")) return "🌫️";
    if (desc.includes("гроза")) return "⛈️";
    if (desc.includes("ветер")) return "💨";
    return "🌤️";
  };

  if (!isOpen) return null;

  return (
    <div id="backdrop">
      <div id="view-route-container">
        <div id="view-route-header">
          <h1>{routeData?.Name || "Маршрут"}</h1>
          <button
            id="view-route-close-button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div id="view-route-content">
          {isLoading && (
            <div className="loading-message">
              <p>⏳ Загрузка данных маршрута...</p>
              <p><small>Расчет статистики может занять время</small></p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ Ошибка: {error}</p>
              <button 
                onClick={loadRouteData}
                className="retry-button"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {routeData && !isLoading && !error && (
            <>
              <div className="main-info-section">
                <div className="route-name">
                  <h2>{routeData.Name }</h2>
                  {routeData.user && (
                    <div className="route-author">
                      <span className="author-label">Автор:</span>
                      <span className="author-name">{routeData.user.FIO }</span>
                    </div>
                  )}
                </div>
                
                {routeData.Description && (
                  <div className="description-section">
                    <h3>Описание</h3>
                    <p>{routeData.Description}</p>
                  </div>
                )}
              </div>

              <div className="time-section">
                <h3>Время маршрута</h3>
                <div className="time-grid">
                  <div className="time-item">
                    <span className="time-label">Начало:</span>
                    <span className="time-value">
                      {formatDateTime(routeData.StartDateTime)}
                    </span>
                  </div>
                  <div className="time-item">
                    <span className="time-label">Окончание:</span>
                    <span className="time-value">
                      {formatDateTime(routeData.EndDateTime)}
                    </span>
                  </div>
                  <div className="time-item">
                    <span className="time-label">Длительность:</span>
                    <span className="time-value">
                      {(() => {
                        if (!routeData.StartDateTime || !routeData.EndDateTime) return "Не указано";
                        const start = new Date(routeData.StartDateTime);
                        const end = new Date(routeData.EndDateTime);
                        const durationMs = end - start;
                        const hours = Math.floor(durationMs / (1000 * 60 * 60));
                        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                        return `${hours} ч ${minutes} мин`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="route-stats-section">
                <h3>Статистика маршрута</h3>
                {routeStats ? (
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Длина:</span>
                      <span className="stat-value">
                        {formatDistance(routeStats.total_distance)}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Сложность:</span>
                      <span className="stat-value complexity-large">
                        {formatNumber(routeStats.total_difficulty)} ед.
                      </span>
                      <div className="complexity-note">
                        <small>(расчет с учетом рельефа, уклона и погоды)</small>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Набор высоты:</span>
                      <span className="stat-value">
                        {formatNumber(routeStats.total_climb)} м
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Спуск:</span>
                      <span className="stat-value">
                        {formatNumber(routeStats.total_descent)} м
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="calculating-stats">
                    <p>⏳ Расчет статистики маршрута...</p>
                    <small>Используется тот же алгоритм, что и при создании маршрута</small>
                    <div className="progress-bar">
                      <div className="progress"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="points-section">
                <div className="section-header">
                  <h3>Точки маршрута ({routeData.dots?.length || 0})</h3>
                  {isWeatherLoading && (
                    <span className="weather-loading">⏳ Загрузка погоды...</span>
                  )}
                </div>
                {routeData.dots && routeData.dots.length > 0 ? (
                  <div className="points-list">
                    {routeData.dots.map((dot, index) => {
                      const coords = getCoordinatesFromDot(dot.ThisDotCoordinates);
                      const arrivalTime = arrivalTimes[index];
                      const weather = weatherData[dot.ID];
                      
                      return (
                        <div key={dot.ID} className="point-item">
                          <div className="point-header">
                            <div>
                              <span className="point-number">Точка {index + 1}</span>
                              <span className="point-id">ID: {dot.ID}</span>
                            </div>
                            {arrivalTime && (
                              <div className="point-time">
                                <span className="time-icon">🕐</span>
                                <span>{formatDateTime(arrivalTime)}</span>
                              </div>
                            )}
                          </div>
                          
                          {coords && (
                            <div className="point-coords">
                              <strong>Координаты:</strong> {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                            </div>
                          )}
                          
                          {weather && (
                            <div className="point-weather">
                              <div className="weather-header">
                                <span className="weather-icon">
                                  {getWeatherIcon(weather.description)}
                                </span>
                                <span className="weather-temp">
                                  {Math.round(weather.temperature)}°C
                                </span>
                                <span className="weather-time">
                                  {formatDateTime(arrivalTime)}
                                </span>
                              </div>
                              <div className="weather-details">
                                <span className="weather-desc">{weather.description}</span>
                                <div className="weather-stats">
                                  <span className="weather-stat">💨 {weather.wind} м/с</span>
                                  <span className="weather-stat">💧 {weather.humidity}%</span>
                                  {weather.city && (
                                    <span className="weather-stat">🏙️ {weather.city}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {index < routeData.dots.length - 1 && (
                            <div className="point-next">
                              <small>→ Следующая точка</small>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="no-points">Точки маршрута не найдены</p>
                )}
              </div>

              {routeData.createdAt && (
                <div className="creation-info">
                  <h3>Информация</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">ID маршрута:</span>
                      <span className="info-value">{routeData.ID}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Создан:</span>
                      <span className="info-value">
                        {formatDateTime(routeData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewRoutePanel;