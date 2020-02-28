'use strict';

const express = require('express');

// Constants
const PORT = process.env.PORT || 3500;

// App
const app = express();
app.get('/', (req, res) => {
    console.log(`Request received at @ ${(new Date()).getTime()} ... `);
    res.send(`<pre>${JSON.stringify(process.env, null, 4)}</pre>`);
});

app.listen(PORT);

console.log(`Running @ ${(new Date()).getTime()} ... Listening on ${PORT}`);