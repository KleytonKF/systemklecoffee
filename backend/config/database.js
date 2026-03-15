const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'klecoffee_system_klecoffee_db',
    user: process.env.DB_USER || 'Kletrotsk',
    password: process.env.DB_PASSWORD || 'ad85177e88aca80dccae',
    database: process.env.DB_NAME || 'klecoffee_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

module.exports = pool.promise();