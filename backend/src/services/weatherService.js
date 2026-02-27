const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Fetch current weather data for a given city
 * @param {string} city - Name of the city
 * @returns {Promise<Object>} Weather data object
 */
const getCurrentWeather = async (city = 'Colombo') => {
    const API_KEY = process.env.WEATHER_API_KEY;
    if (!API_KEY) {
        return { error: 'Weather API key not configured' };
    }

    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);

        return {
            temp: response.data.main.temp,
            description: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            city: response.data.name,
            insight: getEnergyInsight(response.data.main.temp)
        };
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        return { error: 'Failed to fetch weather data' };
    }
};

/**
 * Generate a simple energy insight based on temperature
 */
const getEnergyInsight = (temp) => {
    if (temp > 30) {
        return 'It is very hot today. Cooling appliances like ACs will consume more energy. Consider setting AC to 24°C for efficiency.';
    } else if (temp < 20) {
        return 'It is cool today. Heating appliances or water heaters might be used more. Be mindful of usage.';
    } else {
        return 'The weather is moderate. Optimal for low energy consumption.';
    }
};

module.exports = { getCurrentWeather };
