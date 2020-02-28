'use strict';

const express = require('express');
const fs = require('fs');

// Constants
const PORT = process.env.PORT || 3500;

const dirContents = function (cb) {
    return fs.readdir('/var/www/html', function (err, files) {
        if (err) {
            //console.error(err);
            return cb(null, err.message);
        }
        cb(null, files);
    });
}

const getSqlData = function (data, cb) {
    data.sql = {
        connectionConfig: {
            MYSQL_USER: process.env.MYSQL_USER,
            MYSQL_DATABASE: process.env.MYSQL_DATABASE
        }
    };

    const mysql = require('mysql');
    
    const connection = mysql.createConnection({
        host     : process.env.MYSQL_HOST,
        user     : process.env.MYSQL_USER,
        password : process.env.MYSQL_PASSWORD,
        database : process.env.MYSQL_DATABASE
    });
     
    connection.connect();
    
    const q = data.sql.query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${process.env.MYSQL_DATABASE}';`;

    connection.query(q, function (error, results, fields) {
        if (error) {
            console.error(error);
            data.sql.error = error;
        }
        else {
            data.sql.result = results;
            //data.sql.result = results.map((r) => { return r.table_name; }).join(',');
        }
        cb(null, data);
        connection.end();
    });
}

const getData = function (cb) {
    const data = {
        env: Object.assign({}, process.env)
    };
    delete data.env.MYSQL_PASSWORD;
    dirContents((err, contents) => {
        if (err) return cb(err);
        data.dirContents = contents;
        if (!process.env.MYSQL_USER) return cb(null, data);
        getSqlData(data, cb);
    });
}


// App
const app = express();
app.get('/', (req, res) => {
    const t0 = new Date();
    getData((err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        const t1 = new Date();
        data.took = (t1 - t0);
        console.log(`Request received at @ ${(new Date()).getTime()} ... took ${data.took}ms`);
        res.send(`<pre>${JSON.stringify(data, null, 4)}</pre><div></div>`);
    });
});

app.listen(PORT);

console.log(`Running @ ${(new Date()).getTime()} ... Listening on ${PORT}`);