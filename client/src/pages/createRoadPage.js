import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import YandexMap from "../components/CreateRoadYandexMap";
import "../styles/CreateRoadPage.css";

const CreateRoadPage = () => {
  const navigate = useNavigate();
  const [tempCoords, setTempCoords] = useState(null);
  const [permanentPoints, setPermanentPoints] = useState([]);
  const [points, setPoints] = useState([]);
  const [routeName, setRouteName] = useState("");
  const [complexity, setComplexity] = useState(1);
  const [startDate, setStartDate] = useState("2024-12-20");
  const [startTime, setStartTime] = useState("15:30");
  const [durationHours, setDurationHours] = useState(3);

  const [advice, setAdvice] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получаем пользователя из localStorage
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error("Ошибка получения пользователя из localStorage:", error);
    }
    return null;
  };

  // Когда добавляется 2+ точек, запрашиваем полные данные маршрута
  useEffect(() => {
    if (points.length >= 2) {
      fetchRouteData();
    } else {
      setRouteData(null);
    }
  }, [points, startDate, startTime, durationHours]);

  // Запрос полных данных маршрута
  const fetchRouteData = async () => {
    if (points.length < 2) return;

    setIsLoadingRoute(true);
    try {
      const allRouteData = [];

      for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];

        const startDateTime = `${startDate}T${startTime}:00`;

        const response = await fetch(
          `http://localhost:5000/api/route/elevations?` +
            `startLat=${startPoint.coords[0]}&startLng=${startPoint.coords[1]}&` +
            `endLat=${endPoint.coords[0]}&endLng=${endPoint.coords[1]}&` +
            `startDateTime=${startDateTime}&durationHours=${durationHours}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Получены данные сегмента:", data);

          if (data.success) {
            allRouteData.push({
              segmentIndex: i,
              startPoint: points[i],
              endPoint: points[i + 1],
              data: data,
            });
          }
        } else {
          console.error("Ошибка HTTP:", response.status);
        }
      }

      if (allRouteData.length > 0) {
        const combinedData = combineRouteData(allRouteData);
        setRouteData(combinedData);
        console.log("Объединенные данные маршрута:", combinedData);
      } else {
        console.error("Не удалось получить данные ни для одного сегмента");
        setRouteData(null);
      }
    } catch (error) {
      console.error("Ошибка получения данных маршрута:", error);
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Объединение данных всех сегментов маршрута
  const combineRouteData = (segmentData) => {
    if (!segmentData.length) return null;

    const allTrack = [];
    const allWeather = [];
    let totalStats = {
      total_distance: 0,
      total_difficulty: 0,
      total_climb: 0,
      total_descent: 0,
      max_elevation: -Infinity,
      min_elevation: Infinity,
    };

    let cumulativeTimeOffset = 0;

    segmentData.forEach((segment, segmentIndex) => {
      const segmentTrack = segment.data.track || [];
      const segmentWeather = segment.data.weather_timeline || [];
      const segmentStats = segment.data.statistics || {};

      console.log(`Сегмент ${segmentIndex}:`, {
        trackLength: segmentTrack.length,
        weatherLength: segmentWeather.length,
        stats: segmentStats,
      });

      const pointsToAdd =
        segmentIndex === segmentData.length - 1
          ? segmentTrack
          : segmentTrack.slice(0, -1);

      const adjustedTrack = pointsToAdd.map((point, pointIndex) => {
        const globalIndex = allTrack.length + pointIndex;
        const pointTimeOffset =
          cumulativeTimeOffset + (point.time_offset_hours || 0);

        return {
          lat: point.lat || point[0],
          lng: point.lng || point[1],
          elevation: point.elevation || point[2],
          segmentIndex,
          globalIndex,
          point_index: globalIndex,
          time_offset_hours: pointTimeOffset,
          isMainPoint:
            pointIndex === 0 || pointIndex === segmentTrack.length - 1,
        };
      });

      allTrack.push(...adjustedTrack);

      segmentWeather.forEach((weather) => {
        const globalPointIndex =
          allTrack.length - pointsToAdd.length + weather.point_index;
        const adjustedTimeOffset =
          cumulativeTimeOffset + weather.time_offset_hours;

        allWeather.push({
          ...weather,
          segmentIndex,
          globalPointIndex,
          point_index: globalPointIndex,
          time_offset_hours: adjustedTimeOffset,
          estimated_time: calculateEstimatedTime(
            startDate,
            startTime,
            adjustedTimeOffset
          ),
        });
      });

      cumulativeTimeOffset +=
        segmentStats.estimated_duration_hours || durationHours;

      totalStats.total_distance += segmentStats.total_distance || 0;
      totalStats.total_difficulty += segmentStats.total_difficulty || 0;
      totalStats.total_climb += segmentStats.total_climb || 0;
      totalStats.total_descent += segmentStats.total_descent || 0;
      totalStats.max_elevation = Math.max(
        totalStats.max_elevation,
        segmentStats.max_elevation || -Infinity
      );
      totalStats.min_elevation = Math.min(
        totalStats.min_elevation,
        segmentStats.min_elevation || Infinity
      );
    });

    allTrack.sort((a, b) => a.globalIndex - b.globalIndex);
    console.log("Финальный routeTrack (первые 5 точек):", 
  allTrack.slice(0, 5).map(p => ({
    lat: p.lat,
    lng: p.lng,
    globalIndex: p.globalIndex,
    time_offset_hours: p.time_offset_hours
  }))
);
    return {
      track: allTrack,
      weatherTimeline: allWeather,
      statistics: {
        ...totalStats,
        avg_slope:
          totalStats.total_distance > 0
            ? (
                (totalStats.total_climb / totalStats.total_distance) *
                100
              ).toFixed(1)
            : "0.0",
        estimated_duration_hours: cumulativeTimeOffset,
      },
      segments: segmentData.length,
    };
  };

  // Вспомогательная функция для расчета времени
  const calculateEstimatedTime = (startDate, startTime, offsetHours) => {
    try {
      const startDateTime = new Date(`${startDate}T${startTime}:00`);
      const estimatedTime = new Date(
        startDateTime.getTime() + offsetHours * 60 * 60 * 1000
      );
      return estimatedTime.toISOString();
    } catch (error) {
      console.error("Ошибка расчета времени:", error);
      return new Date().toISOString();
    }
  };

  // Функция для сохранения маршрута в базу данных
  const saveRouteToDatabase = async () => {
    if (points.length < 2) {
      alert("Добавьте минимум 2 точки для создания маршрута!");
      return false;
    }

    if (!routeName.trim()) {
      alert("Введите название маршрута!");
      return false;
    }

    const user = getUserFromStorage();
    if (!user) {
      alert("Пользователь не найден. Пожалуйста, войдите в систему.");
      return false;
    }

    setIsSubmitting(true);
    try {
      // Формируем данные для отправки
      const routeDataToSend = {
        road: {
          Description: advice || routeName,
          UserID: user.id,
          StartDateTime: `${startDate}T${startTime}:00`,
          EndDateTime: calculateEstimatedTime(startDate, startTime, durationHours),
          Name: routeName,
          Complexity: complexity,
          TotalDistance: routeData?.statistics.total_distance || 0,
          TotalClimb: routeData?.statistics.total_climb || 0,
          TotalDescent: routeData?.statistics.total_descent || 0
        },
        dots: points.map((point, index) => ({
          ThisDotCoordinates: `${point.coords[0]},${point.coords[1]}`,
          NextDotCoordinates: index < points.length - 1 
            ? `${points[index + 1].coords[0]},${points[index + 1].coords[1]}`
            : null
        }))
      };

      console.log("Отправляемые данные:", routeDataToSend);

      const response = await fetch('http://localhost:5000/api/roads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeDataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Маршрут успешно создан:", result);
        alert("Маршрут успешно создан!");
        return true;
      } else {
        const errorText = await response.text();
        console.error("Ошибка при создании маршрута:", errorText);
        alert("Ошибка при создании маршрута: " + errorText);
        return false;
      }
    } catch (error) {
      console.error("Ошибка при отправке данных:", error);
      alert("Ошибка при создании маршрута: " + error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчики кнопок
  const handlePublish = async () => {
    const success = await saveRouteToDatabase();
    if (success) {
      navigate('/mainPage');
    }
  };

  const handleContinue = async () => {
    const success = await saveRouteToDatabase();
    if (success) {
      console.log("Продолжение работы с маршрутом");
    }
  };

  const handleCoordinatesChange = (coords) => {
    if (
      tempCoords &&
      Math.abs(tempCoords[0] - coords[0]) < 0.0001 &&
      Math.abs(tempCoords[1] - coords[1]) < 0.0001
    ) {
      setTempCoords(null);
      return;
    }
    setTempCoords(coords);
  };

  const handleAddPoint = () => {
    if (!tempCoords) {
      alert("Сначала выберите точку на карте!");
      return;
    }

    setPermanentPoints([...permanentPoints, tempCoords]);
    setPoints([
      ...points,
      {
        name: `Точка ${points.length + 1}`, // Автоматическое название
        coords: tempCoords,
        id: Date.now(),
      },
    ]);
    setTempCoords(null);
  };

  const handleRemovePoint = (index) => {
    const newPoints = [...points];
    newPoints.splice(index, 1);
    
    // Переименовываем оставшиеся точки
    const renamedPoints = newPoints.map((point, idx) => ({
      ...point,
      name: `Точка ${idx + 1}`
    }));
    
    setPoints(renamedPoints);
    setPermanentPoints(permanentPoints.filter((_, i) => i !== index));
  };

  // Форматирование времени для отображения
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Ошибка форматирования времени:", error);
      return "";
    }
  };

  // Получение погоды для точки по индексу
  const getWeatherForPoint = (pointIndex) => {
    if (!routeData?.weatherTimeline) return null;

    return routeData.weatherTimeline.find(
      (weather) =>
        weather.point_index === pointIndex ||
        weather.globalPointIndex === pointIndex
    );
  };

  // Форматирование описания погоды
  const formatWeatherDescription = (weatherData) => {
    if (!weatherData || !weatherData.weather) return "Нет данных о погоде";

    const weather = weatherData.weather;
    const temp = weather.temperature || "?";
    const wind = weather.windspeed || "?";
    const precipitation = weather.precipitation || "?";

    const getWeatherDescription = (code) => {
      const weatherCodes = {
        0: "Ясно",
        1: "Преимущественно ясно",
        2: "Переменная облачность",
        3: "Пасмурно",
        45: "Туман",
        48: "Туман с инеем",
        51: "Лекая морось",
        53: "Умеренная морось",
        55: "Сильная морось",
        56: "Лекая ледяная морось",
        57: "Сильная ледяная морось",
        61: "Небольшой дождь",
        63: "Умеренный дождь",
        65: "Сильный дождь",
        66: "Ледяной дождь",
        67: "Сильный ледяной дождь",
        71: "Небольшой снег",
        73: "Умеренный снег",
        75: "Сильный снег",
        77: "Снежные зерна",
        80: "Небольшие ливни",
        81: "Умеренные ливни",
        82: "Сильные ливни",
        85: "Небольшие снегопады",
        86: "Сильные снегопады",
        95: "Гроза",
        96: "Гроза с градом",
        99: "Сильная гроза с градом",
      };

      return weatherCodes[code] || "Неизвестно";
    };

    const weatherDescription = getWeatherDescription(weather.weathercode);

    return `${weatherDescription}, ${temp}°C, ветер ${wind} м/с, осадки ${precipitation} мм`;
  };

  return (
    <div className="map-fullscreen">
      <YandexMap
        onCoordinatesChange={handleCoordinatesChange}
        permanentPoints={permanentPoints}
        routeTrack={routeData?.track || []}
        routeWeather={routeData?.weatherTimeline || []}
      />

      <div className="floating-controls">
        

        <div className="panel">
          <h3>Создание маршрута</h3>

          {/* Статистика маршрута */}
          {routeData && (
            <div className="route-stats">
              <h4>Статистика маршрута:</h4>
              <p>Длина: {Math.round(routeData.statistics.total_distance)} м</p>
              <p>
                Сложность: {Math.round(routeData.statistics.total_difficulty)}{" "}
                ед.
              </p>
              <p>
                Набор высоты: {Math.round(routeData.statistics.total_climb)} м
              </p>
              <p>Спуск: {Math.round(routeData.statistics.total_descent)} м</p>
              <p>Сегментов: {routeData.segments}</p>
              {isLoadingRoute && <p>⏳ Загрузка деталей маршрута...</p>}
            </div>
          )}

          {isLoadingRoute && !routeData && (
            <div className="route-stats">
              <p>⏳ Загрузка данных маршрута...</p>
            </div>
          )}

          <div className="form-section">
            <label>Название маршрута:</label>
            <input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Дорога до вокзала"
            />
          </div>

          <div className="form-section">
            <label>Дата и время начала:</label>
            <div className="inline-row">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <label>Длительность маршрута (часы):</label>
            <input
              type="number"
              min="1"
              max="24"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              placeholder="3"
            />
          </div>

          <div className="points-section">
            <h4>Точки маршрута ({points.length})</h4>
            <div className="add-point-row">
              <button onClick={handleAddPoint} className="add-button">
                + Добавить точку
              </button>
            </div>

            {points.map((p, index) => {
              const pointWeather = getWeatherForPoint(index);
              return (
                <div key={p.id} className="point-item">
                  <div className="point-info">
                    <strong>{p.name}</strong>
                    <br />
                    Координаты: {p.coords[0].toFixed(6)},{" "}
                    {p.coords[1].toFixed(6)}
                    {pointWeather && (
                      <>
                        <br />
                        ⏱️ Прибытие: {formatTime(pointWeather.estimated_time)}
                        <br />
                        🌡️ Погода: {formatWeatherDescription(pointWeather)}
                      </>
                    )}
                    {!pointWeather && routeData && <br />}
                  </div>
                  <button
                    onClick={() => handleRemovePoint(index)}
                    className="delete-button"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="form-section">
            <label>Советы для маршрута:</label>
            <textarea
              rows={3}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Например: двигайтесь по асфальтированной дороге до Точки 1..."
            />
          </div>

          <div className="bottom-buttons">
            <button
              className="publish-btn"
              onClick={handlePublish}
              disabled={!routeData || isLoadingRoute || isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Опубликовать"}
            </button>
            <button
              className="continue-btn"
              onClick={handleContinue}
              disabled={!routeData || isLoadingRoute || isSubmitting}
            >
              {isSubmitting ? "Сохранение..." : "Продолжить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoadPage;