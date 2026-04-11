const axios = require('axios');

async function checkLocation() {
    try {
        const response = await axios.get('https://ipapi.co/json/');
        console.log('Location data:', response.data);
    } catch (error) {
        console.log('Error:', error.message);
    }
}

checkLocation();
