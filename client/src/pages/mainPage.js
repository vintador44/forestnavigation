import YandexMap from "./../components/YandexMap";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ViewRoutePanel from "../components/ViewRoutePanel";
import ImageCollection from "../components/ImageCollection";
import { API_KEYS } from "../utils/consts";
import "../styles/ViewLocationPanel.css";

const MainPage = () => {
  const [viewRoutePanelOpen, setViewRoutePanelOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [cordElevation, setCordElevation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roads, setRoads] = useState([]);
  const lastRequestRef = useRef(0);

  const [viewLocationPanelOpen, setViewLocationPanelOpen] = useState(false);
  const [locationData, setLocationData] = useState({});

  const navigate = useNavigate();

  const addLocation = useRef(null);
  const removeLocations = useRef(null);
  const addRoute = useRef(null);
  const removeRoutes = useRef(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [commentText, setCommentText] = useState(""); 
  const [comments, setComments] = useState([]); 

  const [locationPhotos, setLocationPhotos] = useState([]);
  

  const API_BASE_URL = API_KEYS.API_URL;

  const handleRouteSelect = (routeId) => {
    console.log("Выбран маршрут с ID:", routeId);
    setSelectedRouteId(routeId);
    setViewRoutePanelOpen(true);
  };


  const handleCloseRoutePanel = () => {
    setViewRoutePanelOpen(false);
    setSelectedRouteId(null);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      alert("Ошибка: Поле комментария не может быть пустым.");
      return;
    }

    if (!locationData?.ID) {
      alert("Ошибка: Локация не выбрана.");
      return;
    }

    try {

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Ошибка: Вы не авторизованы.");
        return;
      }

      const userRes = await fetch(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        throw new Error("Не удалось загрузить данные пользователя");
      }

      const userData = await userRes.json();
      const authorName = userData.FIO || "Аноним";

      const now = new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const newCommentLine = `\n[${now}] ${authorName}: ${commentText.trim()}`;


      const locRes = await fetch(
        `${API_BASE_URL}/locations/${locationData.ID}`
      );
      if (!locRes.ok) throw new Error("Не удалось загрузить локацию");
      const { location: currentLoc } = await locRes.json();


      const updatedDescription =
        (currentLoc.Description || "") + newCommentLine;


      const updateRes = await fetch(
        `${API_BASE_URL}/locations/${locationData.ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Description: updatedDescription,
            LocationName: currentLoc.LocationName,
            Coordinates: currentLoc.Coordinates,
            Categories: currentLoc.Categories, 
          }),
        }
      );

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || "Ошибка при сохранении комментария");
      }

    
      const updatedLoc = { ...currentLoc, Description: updatedDescription };
      setLocationData(updatedLoc);

     
      setCommentText("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 2000);
    } catch (err) {
      console.error("Ошибка отправки комментария:", err);
      alert(`Ошибка: ${err.message}`);
    }
  };
  

  useEffect(() => {
    loadRoads();
  }, []);


  useEffect(() => {
    if (roads.length > 0 && addRoute.current) {
      showRoadsOnMap();
    }
  }, [roads, addRoute.current]);

  const handleMapLoad = (addLocFn, removeLocFn, addRouteFn, removeRouteFn) => {
    addLocation.current = addLocFn;
    removeLocations.current = removeLocFn;
    addRoute.current = addRouteFn;
    removeRoutes.current = removeRouteFn;

    showLocations();

    if (roads.length > 0) {
      showRoadsOnMap();
    }
  };

  const handleLocationSelect = async (id) => {
    try {

      const response = await fetch(`${API_BASE_URL}/locations/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Error while fetching location: ${response.status}`
        );
      }

      const loc = data.location;

    
      let categories = loc.Categories;
      if (Array.isArray(categories)) {
        categories = categories.map(String).filter(Boolean);
      } else if (typeof categories === "string") {
        categories = categories
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        categories = [];
      }
      loc.Categories = categories;

      setLocationData(loc);


      const photosRes = await fetch(
        `${API_BASE_URL}/photos/location/${id}`
      );
      const photosData = await photosRes.json();

      if (
        photosRes.ok &&
        photosData.success &&
        Array.isArray(photosData.photos)
      ) {
        const photoUrls = photosData.photos.map((photo) => ({
          url: `data:${photo.mimetype || "image/jpeg"};base64,${photo.base64}`,
          file: null,
        }));
        setLocationPhotos(photoUrls);
      } else {
        console.warn("Фото не найдены или ошибка:", photosData);
        setLocationPhotos([]);
      }

      setViewLocationPanelOpen(true);
    } catch (err) {
      console.error("Ошибка при загрузке локации или фото:", err);
      setError(err.message);
    }
  };
  
  const handleUpload = () => {
    alert("Ошибка загрузки фотографий");
  };

  const loadRoads = async () => {
    try {
      console.log("Загрузка маршрутов...");
      const response = await fetch(`${API_BASE_URL}/roads`);
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
      console.error("Error loading roads:", error);
    }
  };

  const showRoadsOnMap = () => {
    if (!addRoute.current || !removeRoutes.current) {
      console.log("Функции карты еще не загружены");
      return;
    }

    console.log("Отображение маршрутов на карте:", roads.length);
    removeRoutes.current();


    const getCoordKey = (coord) => {
      if (!coord) return null;


      if (coord.coordinates && Array.isArray(coord.coordinates)) {
        return `${coord.coordinates[0].toFixed(
          6
        )},${coord.coordinates[1].toFixed(6)}`;
      }

  
      if (typeof coord === "string") {
        const match = coord.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          return `${parseFloat(match[1]).toFixed(6)},${parseFloat(
            match[2]
          ).toFixed(6)}`;
        }
      }

      return null;
    };

  
    const sortDotsByOrder = (dots) => {
      if (!dots || dots.length === 0) return dots;


      const dotMap = new Map();
      const nextMap = new Map(); 

      dots.forEach((dot) => {
        const thisCoord = getCoordKey(dot.ThisDotCoordinates);
        const nextCoord = dot.NextDotCoordinates
          ? getCoordKey(dot.NextDotCoordinates)
          : null;

        dotMap.set(thisCoord, dot);
        if (nextCoord) nextMap.set(thisCoord, nextCoord);
      });


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

      
      const ordered = [];
      let currentKey = startKey;

      while (currentKey && dotMap.has(currentKey)) {
        const dot = dotMap.get(currentKey);
        ordered.push(dot);
        currentKey = nextMap.get(currentKey) || null;
      }

      return ordered;
    };

    roads.forEach((road, index) => {
      console.log(`Обработка маршрута ${index + 1}:`, road);


      const sortedDots = sortDotsByOrder(road.dots);

      const routeCoordinates = sortedDots
        .map((dot) => {
          if (dot.ThisDotCoordinates?.coordinates) {
            const [lng, lat] = dot.ThisDotCoordinates.coordinates;
            return [lat, lng];
          } else if (typeof dot.ThisDotCoordinates === "string") {
            const match = dot.ThisDotCoordinates.match(
              /POINT\(([^ ]+) ([^)]+)\)/
            );
            if (match) {
              const lng = parseFloat(match[1]);
              const lat = parseFloat(match[2]);
              return [lat, lng];
            }
          }
          console.warn("Некорректные координаты:", dot);
          return null;
        })
        .filter(Boolean);

      console.log(`Координаты маршрута ${index + 1}:`, routeCoordinates);

      if (routeCoordinates.length > 1) {

        const handleRouteClick = () => {
          console.log("Клик по маршруту:", road.ID);
          handleRouteSelect(road.ID);
        };


        addRoute.current(
          routeCoordinates,
          road.Name || `Маршрут ${road.ID}`,
          road.Description || "Без описания",
          road.Complexity || "Не указана",
          handleRouteClick 
        );
        console.log(`Маршрут ${index + 1} добавлен на карту`);
      } else {
        console.warn(
          `Маршрут ${index + 1} имеет недостаточно точек:`,
          routeCoordinates.length
        );
      }
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Поиск:", searchQuery);
    showLocations();
  };

  const handleCoordinatesChange = (newCoordinates) => {
    setCoordinates(newCoordinates);
    setError(null);
  };

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
  };

  const handleCreateLandmark = () => {
    if (!coordinates) {
      setError("Сначала выберите точку на карте");
      return;
    }
    navigate("/create-location", {
      state: {
        coordinates: coordinates,
        elevation: cordElevation,
      },
    });
  };

  const handleCreateRoute = () => {
    navigate("/create-route");
  };

  const showLocations = () => {
    const locations = getLocations(searchQuery);
    locations.then((value) => {
      if (removeLocations.current && addLocation.current) {
        removeLocations.current();
        value.locations.forEach((loc) => {
          addLocation.current(
            loc.LocationName,
            loc.Description,
            loc.Coordinates,
            loc.ID
          );
        });
      }
    });
  };

  async function getRealElevation(lat, lng) {
    if (!lat || !lng) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/elevation?lat=${lat}&lng=${lng}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success) {
        setCordElevation(data.elevation);
      } else {
        throw new Error(data.error || "Failed to get elevation");
      }
    } catch (error) {
      console.error("Error fetching elevation:", error);
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
        `${API_BASE_URL}/locations` +
          (tagString ? `?tags=${tagString}` : "")
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error getting locations:", error);
      setError(error.message);
      return { locations: [] };
    }
  }

  return (
    <div className="main-page">
      <div style={{ position: "relative", width: "100%", height: "80%" }}>
        <YandexMap
          onMapLoad={handleMapLoad}
          onCoordinatesChange={handleCoordinatesChange}
          onElevationChange={handleCordElevationChange}
          onLocationSelect={handleLocationSelect}
          apiKey={API_KEYS.YANDEX_MAPS}
        />

   
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "23%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "90%",
            maxWidth: "500px",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{ display: "flex", gap: "10px" }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тегам"
              style={{
                flex: 1,
                padding: "12px 16px",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
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

       

        <button className="action-button" onClick={handleCreateRoute}>
          Создать маршрут
        </button>
      </div>

      {viewLocationPanelOpen && (
        <div id="backdrop">
          <div id="view-location-container">
           
            <div id="view-location-header">
        
              <h1>{locationData.LocationName}</h1>

              {/* Кнопка закрытия */}
              <button
                id="view-location-close-button"
                onClick={(_) => setViewLocationPanelOpen(false)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

         
            <ImageCollection
              images={locationPhotos}
              uploadHandler={handleUpload}
              readOnly={true}
            />

            <div id="view-location-comments-section">
              <h3 style={{ paddingLeft: "40px" }}>Комментарии</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentSubmit(); // Вызываем функцию отправки
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    width: "98%",
                    paddingLeft: "40px",
                  }}
                >
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Добавить комм"
                    style={{
                      flex: 1,
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    ➤
                  </button>
                </div>
              </form>
            </div>
            {/* === КОНЕЦ НОВОГО БЛОКА === */}

            <div id="view-location-data-container">
              {/* Описание */}
              <p id="view-location-desc">{locationData.Description}</p>

              {/* Координаты и высота */}
              <div id="view-location-coordinates-info">
                <p>
                  <strong>Координаты:</strong>{" "}
                  {locationData.Coordinates[0].toFixed(6)},{" "}
                  {locationData.Coordinates[1].toFixed(6)}
                </p>
              </div>

              <hr></hr>

              {/* Категории */}
              <div>
                <h6 className="view-location-label">Категории:</h6>
                <div id="view-location-categories">
                  {Array.isArray(locationData.Categories) &&
                  locationData.Categories.length > 0 ? (
                    locationData.Categories.map((cat) => (
                      <span key={cat} className="view-location-category-tag">
                        {String(cat)}
                      </span>
                    ))
                  ) : (
                    <p id="view-location-empty-categories">Нет категорий</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewRoutePanelOpen && (
        <ViewRoutePanel
          routeId={selectedRouteId}
          onClose={handleCloseRoutePanel}
          isOpen={viewRoutePanelOpen}
        />
      )}
    </div>
  );
};

export default MainPage;