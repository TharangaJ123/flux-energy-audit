const axios = require('axios');
const API_KEY = 'd08e30873c7087d0dcdb1f33e1b03528';

async function testWeather(city) {
    console.log(`Testing city: "${city}"`);
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        console.log('Success:', response.data.name);
    } catch (error) {
        console.log('Error status:', error.response ? error.response.status : 'No response');
        console.log('Error data:', error.response ? error.response.data : error.message);
    }
    console.log('---');
}

async function run() {
    await testWeather('New York');
    await testWeather('Colombo, Sri Lanka');
    await testWeather('Colombo,LK');
    await testWeather('NonExistentCityName');
}

run();
