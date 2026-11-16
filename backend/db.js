import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'YourDatabaseName',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' ? true : false, // Use true for Azure, false for local SQL Server
        trustServerCertificate: true // Change to false for production if using proper certificates
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

try {
    poolPromise = new sql.ConnectionPool(dbConfig)
        .connect()
        .then(pool => {
            console.log('Connected to SQL Server successfully.');
            return pool;
        })
        .catch(err => {
            console.error('Database Connection Failed! Bad Config: ', err);
            throw err;
        });
} catch (error) {
    console.error('Error initializing SQL connection pool:', error);
}

export { sql, poolPromise };
