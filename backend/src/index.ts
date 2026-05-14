import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { authenticateToken, isAdmin, AuthRequest } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]) as any[];
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Первый пользователь будет админом
    const [usersCount] = await pool.query('SELECT COUNT(*) as count FROM users') as any[];
    const role = usersCount[0].count === 0 ? 'admin' : 'user';

    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );

    res.status(201).json({ message: 'Пользователь зарегистрирован' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при регистрации' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]) as any[];
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при входе' });
  }
});

// GET /api/services - Получение списка услуг
app.get('/api/services', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/admin/services - Добавление услуги (только админ)
app.post('/api/admin/services', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, price } = req.body;
    const [result] = await pool.query(
      'INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
      [name, description, price]
    ) as any[];
    
    res.status(201).json({ id: result.insertId, name, description, price });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при добавлении услуги' });
  }
});

// DELETE /api/admin/services/:id - Удаление услуги (только админ)
app.delete('/api/admin/services/:id', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при удалении услуги' });
  }
});

// POST /api/bookings - Создание записи
app.post('/api/bookings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { service_id, booking_date } = req.body;
    const user_id = req.user!.id;

    // Проверка даты (нельзя на прошедшую)
    if (new Date(booking_date) < new Date()) {
      return res.status(400).json({ message: 'Нельзя записаться на прошедшую дату' });
    }

    const [result] = await pool.query(
      'INSERT INTO bookings (user_id, service_id, booking_date, status) VALUES (?, ?, ?, ?)',
      [user_id, service_id, booking_date, 'confirmed']
    ) as any[];

    res.status(201).json({ id: result.insertId, user_id, service_id, booking_date, status: 'confirmed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при создании записи' });
  }
});

// GET /api/my-bookings - Просмотр своих записей
app.get('/api/my-bookings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user_id = req.user!.id;
    const [rows] = await pool.query(`
      SELECT b.*, s.name as service_name, s.price 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `, [user_id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении записей' });
  }
});

// DELETE /api/bookings/:id - Отмена записи
app.delete('/api/bookings/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user!.id;

    // Проверяем, что запись принадлежит пользователю (если не админ)
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]) as any[];
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    if (rows[0].user_id !== user_id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Вы не можете отменить чужую запись' });
    }

    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: 'Запись отменена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при отмене записи' });
  }
});

// GET /api/admin/all-bookings - Все записи (Админ)
app.get('/api/admin/all-bookings', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, s.name as service_name, u.username 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.user_id = u.id
      ORDER BY b.booking_date DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка при получении всех записей' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
