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

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
