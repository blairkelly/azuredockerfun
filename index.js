'use strict';

console.log(`Running @ ${(new Date()).getTime()} !`);

const express = require('express');

// Constants
const PORT = process.env.PORT || 3500;

// App
const app = express();
app.get('/', (req, res) => {
    const data = {
        PORT,
        testString: "This is a test string"
    };
    res.send(`<pre>${JSON.stringify(data, null, 4)}</pre>`);
});

app.listen(PORT);
