import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import Home from './pages/Home.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';
import AdminServices from './pages/AdminServices.js';

interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="app">
        <header className="header">
          <Link to="/" className="logo"><h1>Система онлайн-записи</h1></Link>
          <nav>
            <ul>
              <li><Link to="/">Главная</Link></li>
              {user ? (
                <>
                  {user.role === 'admin' && <li><Link to="/admin/services">Услуги (Админ)</Link></li>}
                  <li><Link to="/bookings">Мои записи</Link></li>
                  <li><span className="user-name">Привет, {user.username}!</span></li>
                  <li><button className="logout-btn" onClick={handleLogout}>Выход</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Вход</Link></li>
                  <li><Link to="/register">Регистрация</Link></li>
                </>
              )}
            </ul>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/bookings" element={<div className="container"><h2>Мои записи (Будет на 3 неделе)</h2></div>} />
        </Routes>

        <footer className="footer">
          <p>&copy; 2026 Система онлайн-записи</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
