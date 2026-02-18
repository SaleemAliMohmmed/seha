const axios = require('axios');

async function verifyLogin() {
    try {
        const response = await axios.post('http://localhost:3005/api/login', {
            username: 'admin',
            password: 'password123'
        });

        console.log('Login successful!');
        console.log('Token:', response.data.token ? 'RECIEVED' : 'MISSING');
        console.log('Role:', response.data.role);
    } catch (error) {
        console.error('Login failed:', error.response ? JSON.stringify(error.response.data) : error.message);
        if (error.code) console.error('Error Code:', error.code);
    }
}

verifyLogin();
