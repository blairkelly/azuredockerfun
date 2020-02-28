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

const getTableContents = function (data, connection, cb) {
    const tc = data.sql.tableContents = {};
    
    const randoTable = data.tables.results[Math.floor(Math.random() * data.tables.results.length)].TABLE_NAME;

    const q = tc.query = `SELECT * FROM ${randoTable} LIMIT 5;`;

    const t0 = new Date();
    
    connection.query(q, function (error, results, fields) {
        const t1 = new Date();
        if (error) {
            console.error(error);
            tc.error = error;
        }
        else {
            tc.took = (t1 - t0);
            tc.resultCount = results.length;
        }
        cb(null, data);
    });
}

const getTables = function (data, connection, cb) {
    const tables = data.sql.tables = {};
    const q = tables.query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${process.env.MYSQL_DATABASE}';`;

    const t0 = new Date();
    
    connection.query(q, function (error, results, fields) {
        const t1 = new Date();
        if (error) {
            console.error(error);
            tables.error = error;
        }
        else {
            tables.took = (t1 - t0);
            tables.resultCount = results.length;
            //tables.results = results.map((r) => { return r.TABLE_NAME; }).join(' ');
            tables.results = results;
        }
        getTableContents(data, connection, cb);
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
    
    getTables(data, connection, function (err, data) {
        connection.end();
        cb(null, data);
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
        res.send(`<div>Took: ${data.took}. Got:</div><pre>${JSON.stringify(data, null, 4)}</pre>`);
    });
});

app.listen(PORT);

console.log(`Running @ ${(new Date()).getTime()} ... Listening on ${PORT}`);
