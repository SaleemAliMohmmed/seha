const express = require('express');
const app = express();
const PORT = 3001;

app.get('/', (req, res) => res.send('Hello'));

const server = app.listen(PORT, () => {
    console.log(`Debug Server running on port ${PORT}`);
});

process.on('exit', (code) => {
    console.log(`Debug Process exited with code: ${code}`);
});
