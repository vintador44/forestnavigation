const axios = require("axios");
const { Road, Dot, User } = require("../models");

class RouteController {
  constructor() {
    this.requestsPerMinute = 60;
    this.requestInterval = 60000 / this.requestsPerMinute;
    this.maxTimeSeconds = 5;
    this.lastRequestTime = 0;

    this.getRouteElevations = this.getRouteElevations.bind(this);
    this.validateCoordinates = this.validateCoordinates.bind(this);
    this.calculateMaxPoints = this.calculateMaxPoints.bind(this);
    this.splitRoute = this.splitRoute.bind(this);
    this.getRouteDataForPoints = this.getRouteDataForPoints.bind(this);
    this.fetchElevation = this.fetchElevation.bind(this);
    this.fetchWeatherForecast = this.fetchWeatherForecast.bind(this);
    this.waitForRateLimit = this.waitForRateLimit.bind(this);
    this.calculateSegmentStats = this.calculateSegmentStats.bind(this);
    this.distributeWeatherByTime = this.distributeWeatherByTime.bind(this);
    this.createRoad = this.createRoad.bind(this);
    this.validateRoadData = this.validateRoadData.bind(this);
    this.formatCoordinates = this.formatCoordinates.bind(this);
  }

  async createRoad(req, res) {
    try {
      const { road, dots } = req.body;


      const validationError = this.validateRoadData(road, dots);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError,
        });
      }


      const user = await User.findByPk(road.UserID);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Пользователь не найден",
        });
      }


      const newRoad = await Road.create({
        Description: road.Description,
        UserID: road.UserID,
        StartDateTime: road.StartDateTime,
        EndDateTime: road.EndDateTime,
        Name: road.Name,
        Complexity: road.Complexity,
        TotalDistance: road.TotalDistance,
        TotalClimb: road.TotalClimb,
        TotalDescent: road.TotalDescent,
      });

      console.log(`Создан маршрут ID: ${newRoad.ID}`);


      const dotPromises = dots.map((dot, index) => {
        const isLastPoint = index === dots.length - 1;

        return Dot.create({
          ThisDotCoordinates: this.formatCoordinates(dot.ThisDotCoordinates),
          NextDotCoordinates: !isLastPoint
            ? this.formatCoordinates(dot.NextDotCoordinates)
            : null,
          RoadID: newRoad.ID,
        });
      });

      const createdDots = await Promise.all(dotPromises);
      console.log(
        `Создано ${createdDots.length} точек для маршрута ID: ${newRoad.ID}`
      );


      const roadWithDots = await Road.findByPk(newRoad.ID, {
        include: [
          {
            model: Dot,
            as: "dots",
            attributes: [
              "ID",
              "ThisDotCoordinates",
              "NextDotCoordinates",
              "RoadID",
            ],
          },
        ],
        attributes: { exclude: ["UserID"] },
      });

      res.status(201).json({
        success: true,
        message: "Маршрут успешно создан",
        data: {
          road: roadWithDots,
        },
      });
    } catch (error) {
      console.error("Ошибка при создании маршрута:", error);
      res.status(500).json({
        success: false,
        error: "Внутренняя ошибка сервера",
        details: error.message,
      });
    }
  }

  validateRoadData(road, dots) {

    if (!road || typeof road !== "object") {
      return "Неверный формат данных маршрута";
    }

    const requiredRoadFields = [
      "Description",
      "UserID",
      "StartDateTime",
      "Name",
    ];
    for (const field of requiredRoadFields) {
      if (!road[field]) {
        return `Отсутствует обязательное поле: ${field}`;
      }
    }


    if (isNaN(road.UserID) || road.UserID <= 0) {
      return "Неверный идентификатор пользователя";
    }


    if (isNaN(new Date(road.StartDateTime).getTime())) {
      return "Неверный формат даты начала";
    }

    if (road.EndDateTime && isNaN(new Date(road.EndDateTime).getTime())) {
      return "Неверный формат даты окончания";
    }


    if (!dots || !Array.isArray(dots) || dots.length < 2) {
      return "Маршрут должен содержать минимум 2 точки";
    }

  
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      if (!dot.ThisDotCoordinates) {
        return `Точка ${i + 1}: отсутствуют координаты`;
      }

      
      const coordsRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
      if (!coordsRegex.test(dot.ThisDotCoordinates)) {
        return `Точка ${i + 1}: неверный формат координат`;
      }


      if (i < dots.length - 1 && !dot.NextDotCoordinates) {
        return `Точка ${i + 1}: отсутствуют координаты следующей точки`;
      }


      if (dot.NextDotCoordinates && !coordsRegex.test(dot.NextDotCoordinates)) {
        return `Точка ${i + 1}: неверный формат координат следующей точки`;
      }
    }

    return null;
  }

  formatCoordinates(coordsString) {

    const [lat, lng] = coordsString
      .split(",")
      .map((coord) => parseFloat(coord).toFixed(6));

    return `POINT(${lng} ${lat})`;
  }



  async getRoadsByUser(req, res) {
    try {
      const { userId } = req.params;

      const roads = await Road.findAll({
        where: { UserID: userId },
        include: [
          {
            model: Dot,
            as: "dots",
            attributes: [
              "ID",
              "ThisDotCoordinates",
              "NextDotCoordinates",
              "RoadID",
            ],
          },
        ],
        order: [["StartDateTime", "DESC"]],
      });

      res.json({
        success: true,
        data: {
          roads,
          count: roads.length,
        },
      });
    } catch (error) {
      console.error("Ошибка при получении маршрутов:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка при получении маршрутов",
      });
    }
  }

  async getRoadById(req, res) {
    try {
      const { id } = req.params;

      const road = await Road.findByPk(id, {
        include: [
          {
            model: Dot,
            as: "dots",
            attributes: [
              "ID",
              "ThisDotCoordinates",
              "NextDotCoordinates",
              "RoadID",
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["ID", "FIO", "Email"],
          },
        ],
      });
      if (!road) {
        return res.status(404).json({
          success: false,
          error: "Маршрут не найден",
        });
      }

      res.json({
        success: true,
        data: { road },
      });
    } catch (error) {
      console.error("Ошибка при получении маршрута:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка при получении маршрута",
      });
    }
  }

  async deleteRoad(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const road = await Road.findByPk(id);

      if (!road) {
        return res.status(404).json({
          success: false,
          error: "Маршрут не найден",
        });
      }

   
      if (road.UserID !== parseInt(userId)) {
        return res.status(403).json({
          success: false,
          error: "Недостаточно прав для удаления маршрута",
        });
      }


      await Dot.destroy({ where: { RoadID: id } });


      await road.destroy();

      res.json({
        success: true,
        message: "Маршрут успешно удален",
      });
    } catch (error) {
      console.error("Ошибка при удалении маршрута:", error);
      res.status(500).json({
        success: false,
        error: "Ошибка при удалении маршрута",
      });
    }
  }

  async getRouteElevations(req, res) {
    try {
      const {
        startLat,
        startLng,
        endLat,
        endLng,
        startDateTime,
        durationHours = 3,
      } = req.query;


      if (!this.validateCoordinates(startLat, startLng, endLat, endLng)) {
        return res.status(400).json({
          success: false,
          error: "Invalid coordinates provided",
        });
      }

      const startPoint = [parseFloat(startLat), parseFloat(startLng)];
      const endPoint = [parseFloat(endLat), parseFloat(endLng)];

      const maxPoints = this.calculateMaxPoints();
      const routePoints = this.splitRoute(startPoint, endPoint, maxPoints);

      console.log(
        `Разбиваем маршрут на ${routePoints.length} точек за ${durationHours} часов`
      );


      const routeData = await this.getRouteDataForPoints(
        routePoints,
        startDateTime,
        parseFloat(durationHours)
      );

      res.json({
        success: true,
        track: routeData.track,
        statistics: routeData.statistics,
        weather_timeline: routeData.weatherTimeline,
        points_count: routeData.track.length,
        total_duration_hours: durationHours,
      });
    } catch (error) {
      console.error("Route elevations error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get route data",
        details: error.message,
      });
    }
  }

  calculateMaxPoints() {
    const maxPoints = Math.floor(this.maxTimeSeconds);
    return Math.min(Math.max(2, maxPoints), 5);
  }

  splitRoute(startPoint, endPoint, numberOfPoints) {
    const [startLat, startLng] = startPoint;
    const [endLat, endLng] = endPoint;

    const points = [];

    for (let i = 0; i < numberOfPoints; i++) {
      const fraction = i / (numberOfPoints - 1);
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      points.push([lat, lng]);
    }

    return points;
  }

 async getRouteDataForPoints(points, startDateTime, durationHours) {
  const track = [];
  const weatherTimeline = [];
  let totalDistance = 0, totalDifficulty = 0, totalClimb = 0, totalDescent = 0;


  const [middleLat, middleLng] = points[Math.floor(points.length / 2)];
  let weatherData = null;
  if (startDateTime) {
    await this.waitForRateLimit();
    weatherData = await this.fetchWeatherForecast(middleLat, middleLng, startDateTime, durationHours);
  }


  const pointTimesSec = [0]; 
  let cumulativeTimeSec = 0;

  // Первая точка
  const firstElevation = await this.fetchElevation(points[0][0], points[0][1]);
  track.push({
    lat: points[0][0],
    lng: points[0][1],
    elevation: firstElevation,
    point_index: 0,
  });


  for (let i = 1; i < points.length; i++) {
    const [lat, lng] = points[i];
    
    await this.waitForRateLimit();
    const elevation = await this.fetchElevation(lat, lng);
    
    const pointData = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      elevation: parseFloat(elevation.toFixed(2)),
      point_index: i,
    };
    track.push(pointData);


    const prevPoint = track[i - 1];
    const segmentStats = this.calculateSegmentStats(prevPoint, pointData);


    const AVERAGE_SPEED_M_S = 5000 / 3600; 
    const segmentTimeSec = segmentStats.difficulty / AVERAGE_SPEED_M_S;
    cumulativeTimeSec += segmentTimeSec;
    pointTimesSec.push(cumulativeTimeSec);

    // Итоги
    totalDistance += segmentStats.distance;
    totalDifficulty += segmentStats.difficulty;
    totalClimb += segmentStats.climb;
    totalDescent += segmentStats.descent;
  }

 
  const actualDurationSec = pointTimesSec[pointTimesSec.length - 1] || 1;
  const targetDurationSec = durationHours * 3600;
  const timeScale = targetDurationSec / actualDurationSec;

  const scaledPointTimesHours = pointTimesSec.map(t => (t * timeScale) / 3600);


  for (let i = 0; i < track.length; i++) {
    const pointTimeOffsetHours = scaledPointTimesHours[i];
    
    let pointWeather = null;
    if (weatherData && startDateTime) {
      pointWeather = this.distributeWeatherByTime(weatherData, pointTimeOffsetHours);
      weatherTimeline.push({
        point_index: i,
        coordinates: { lat: track[i].lat, lng: track[i].lng },
        time_offset_hours: parseFloat(pointTimeOffsetHours.toFixed(2)),
        estimated_time: this.calculateEstimatedTime(startDateTime, pointTimeOffsetHours),
        weather: pointWeather,
      });
    }
  }


  const statistics = {
    total_distance: Math.round(totalDistance),
    total_difficulty: Math.round(totalDifficulty),
    total_climb: Math.round(totalClimb),
    total_descent: Math.round(totalDescent),
    max_elevation: Math.max(...track.map(p => p.elevation)),
    min_elevation: Math.min(...track.map(p => p.elevation)),
    avg_slope: totalDistance > 0 ? ((totalClimb / totalDistance) * 100).toFixed(1) : 0,
    estimated_duration_hours: parseFloat((scaledPointTimesHours[scaledPointTimesHours.length - 1]).toFixed(2)),
  };

  return { track, statistics, weatherTimeline };
}

 distributeWeatherByTime(weatherData, timeOffsetHours) {
  const hourlyTimes = weatherData.hourly.time; 
  const targetTimeMs = new Date(hourlyTimes[0]).getTime() + timeOffsetHours * 3600 * 1000;


  let bestIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < hourlyTimes.length; i++) {
    const slotTimeMs = new Date(hourlyTimes[i]).getTime();
    const diff = Math.abs(slotTimeMs - targetTimeMs);
    if (diff < minDiff) {
      minDiff = diff;
      bestIndex = i;
    }
  }

  return {
    temperature: weatherData.hourly.temperature_2m[bestIndex],
    precipitation: weatherData.hourly.precipitation[bestIndex],
    weathercode: weatherData.hourly.weathercode[bestIndex],
    windspeed: weatherData.hourly.windspeed_10m[bestIndex],
    time: hourlyTimes[bestIndex],
    relative_time: `+${timeOffsetHours.toFixed(1)}ч`,
  };
}

  calculateEstimatedTime(startDateTime, offsetHours) {
    const startTime = new Date(startDateTime);
    startTime.setHours(startTime.getHours() + offsetHours);
    return startTime.toISOString();
  }

  calculateSegmentStats(point1, point2, weather = null) {
    const R = 6371000;

    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const elevationDiff = point2.elevation - point1.elevation;
    const climb = elevationDiff > 0 ? elevationDiff : 0;
    const descent = elevationDiff < 0 ? Math.abs(elevationDiff) : 0;

    const slope = (Math.atan2(elevationDiff, distance) * 180) / Math.PI;
    let difficultyMultiplier;

    if (elevationDiff > 0) {
      difficultyMultiplier = 1.0 + 0.092 * slope + 0.00023 * slope ** 2;
    } else {
      const slopeAbs = Math.abs(slope);
      difficultyMultiplier =
        slopeAbs <= 10 ? 1.0 - 0.05 * slopeAbs : 0.5 + 0.03 * (slopeAbs - 10);
    }


    let weatherMultiplier = 1.0;
    
    if (weather) {

      const temp = weather.temperature;
      if (temp < -10) weatherMultiplier *= 1.4;
      else if (temp < 0) weatherMultiplier *= 1.2;
      else if (temp > 30) weatherMultiplier *= 1.3;
      else if (temp > 25) weatherMultiplier *= 1.1; 


      const wind = weather.windspeed;
      if (wind > 15) weatherMultiplier *= 1.4; 
      else if (wind > 10) weatherMultiplier *= 1.2; 
      else if (wind > 6) weatherMultiplier *= 1.1; 

    
      const precipitation = weather.precipitation;
      if (precipitation > 5) weatherMultiplier *= 1.5; 
      else if (precipitation > 2) weatherMultiplier *= 1.3; 
      else if (precipitation > 0.5) weatherMultiplier *= 1.1; 


      const weatherCode = weather.weathercode;

      const adverseWeatherCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99, 45, 48];
      if (adverseWeatherCodes.includes(weatherCode)) {
        weatherMultiplier *= 1.3;
      }
    }


    const totalMultiplier = difficultyMultiplier * weatherMultiplier;
    const difficulty = distance * totalMultiplier;

    return {
      distance,
      difficulty,
      climb,
      descent,
      slope: parseFloat(slope.toFixed(1)),
      weatherMultiplier: parseFloat(weatherMultiplier.toFixed(2))
    };
}

  async fetchElevation(lat, lng) {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
      { timeout: 10000 }
    );

    if (!response.data.elevation || response.data.elevation.length === 0) {
      throw new Error("Elevation data not found");
    }

    return response.data.elevation[0];
  }

  async fetchWeatherForecast(lat, lng, startDateTime, durationHours) {

    const startDate = new Date(startDateTime);
    const endDate = new Date(
      startDate.getTime() + durationHours * 60 * 60 * 1000
    );

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&start_date=${startDateStr}&end_date=${endDateStr}&timezone=auto`,
      { timeout: 10000 }
    );

    if (!response.data.hourly) {
      throw new Error("Weather forecast data not found");
    }

    return response.data;
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestInterval) {
      const waitTime = this.requestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  validateCoordinates(startLat, startLng, endLat, endLng) {
    const coords = [startLat, startLng, endLat, endLng];

    for (const coord of coords) {
      if (!coord || isNaN(coord)) return false;

      const num = parseFloat(coord);
      if (coord === startLat || coord === endLat) {
        if (num < -90 || num > 90) return false;
      } else {
        if (num < -180 || num > 180) return false;
      }
    }

    return true;
  }


async getAllRoads(req, res) {
  try {
    const roads = await Road.findAll({
      include: [
        {
          model: Dot,
          as: "dots",
          attributes: [
            "ID",
            "ThisDotCoordinates",
            "NextDotCoordinates",
            "RoadID",
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["ID", "FIO", "Email"],
        },
      ],
      order: [["StartDateTime", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        roads,
        count: roads.length,
      },
    });
  } catch (error) {
    console.error("Ошибка при получении маршрутов:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка при получении маршрутов",
    });
  }
}
}

module.exports = new RouteController();
