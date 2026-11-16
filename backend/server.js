import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sql, poolPromise } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Endpoint tra cứu nhân viên (Employee Lookup)
// Hỗ trợ tìm kiếm theo tên hoặc mã nhân viên qua query params: /api/employees?search=keyword hoặc /api/employees?id=123
app.get('/api/employees', async (req, res) => {
    try {
        const { search, id } = req.query;
        const pool = await poolPromise;
        let query = 'SELECT * FROM Employees WHERE 1=1';
        let request = pool.request();

        if (id) {
            query += ' AND EmployeeID = @id';
            request.input('id', sql.Int, id);
        } else if (search) {
            query += ' AND (FullName LIKE @search OR EmployeeCode LIKE @search OR Email LIKE @search)';
            request.input('search', sql.VarChar, `%${search}%`);
        }

        const result = await request.query(query);
        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

// API Endpoint tra cứu nhân viên theo ID trực tiếp trên URL path
app.get('/api/employees/:id', async (req, res) => {
    try {
        const employeeId = req.params.id;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, employeeId)
            .query('SELECT * FROM Employees WHERE EmployeeID = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: err.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('VNApp AI Agent Backend API is running.');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
