const axios = require("axios");

const WeatherController = {
  // Попробуем другой ключ или проверим текущий
  API_KEY: "32e393b98723e6676345497f0ce2ccc8",


  async getForecastByDateRange(req, res) {
    const { 
      lat, 
      lng, 
      fromDate,  // Начальная дата (YYYY-MM-DD)
      toDate,    // Конечная дата (YYYY-MM-DD)
      fromDateTime, // Начальная дата-время (YYYY-MM-DD HH:MM:SS)
      toDateTime    // Конечная дата-время (YYYY-MM-DD HH:MM:SS)
    } = req.query;

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&lang=ru&appid=32e393b98723e6676345497f0ce2ccc8`;
      
      const response = await axios.get(url);
      const data = response.data;

      let forecastList = data.list;

      // Фильтрация по диапазону дат
      if (fromDate && toDate) {
        forecastList = forecastList.filter(item => {
          const itemDate = item.dt_txt.split(' ')[0]; // Берем только дату
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      // Фильтрация по точному диапазону дата-время
      if (fromDateTime && toDateTime) {
        forecastList = forecastList.filter(item => {
          return item.dt_txt >= fromDateTime && item.dt_txt <= toDateTime;
        });
      }

      const formattedForecast = forecastList.map(item => ({
        datetime: item.dt_txt,
        timestamp: item.dt,
        date: item.dt_txt.split(' ')[0],
        time: item.dt_txt.split(' ')[1],
        temperature: Math.round(item.main.temp),
        feels_like: Math.round(item.main.feels_like),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        icon_url: `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
        humidity: item.main.humidity,
        wind: Math.round(item.wind.speed * 10) / 10,
        pressure: item.main.pressure,
        pop: Math.round(item.pop * 100) // вероятность осадков в %
      }));

      res.json({
        success: true,
        city: data.city.name,
        country: data.city.country,
        forecast_count: formattedForecast.length,
        date_range: {
          from: fromDate || fromDateTime,
          to: toDate || toDateTime
        },
        forecast: formattedForecast
      });

    } catch (err) {
      console.error("Ошибка запроса прогноза по датам:", err.message);
      res.status(500).json({ 
        success: false, 
        error: "Не удалось получить прогноз погоды" 
      });
    }
  },

  async getWeather(req, res) {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: "Не указаны координаты" });
    }

    try {
      // Используем HTTPS и правильный формат параметров
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=ru&appid=32e393b98723e6676345497f0ce2ccc8`;
      
      

      const response = await axios.get(url);

      const data = response.data;


      res.json({
        success: true,
        temperature: data.main.temp,
        description: data.weather[0].description,
        wind: data.wind.speed,
        humidity: data.main.humidity,
        city: data.name,
      });
    } catch (err) {
      console.error("Ошибка запроса погоды:", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        return res.status(401).json({ 
          success: false, 
          error: "Неверный API ключ. Проверьте ключ на openweathermap.org" 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: "Не удалось получить погоду" 
      });
    }
  }
};

module.exports = WeatherController;