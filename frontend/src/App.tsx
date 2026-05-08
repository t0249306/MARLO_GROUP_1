import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios'

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/services');
        setServices(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке услуг:', err);
        setError('Не удалось загрузить список услуг. Убедитесь, что бэкенд запущен.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Система онлайн-записи</h1>
        <nav>
          <ul>
            <li><a href="/">Главная</a></li>
            <li><a href="/bookings">Мои записи</a></li>
            <li><a href="/login">Вход</a></li>
          </ul>
        </nav>
      </header>

      <main className="container">
        <section className="hero">
          <h2>Запишитесь на услугу онлайн</h2>
          <p>Быстро, удобно, надежно.</p>
        </section>

        <section className="services">
          <h3>Наши услуги</h3>
          {loading && <p>Загрузка...</p>}
          {error && <p className="error">{error}</p>}
          
          <div className="services-grid">
            {services.length > 0 ? (
              services.map(service => (
                <div key={service.id} className="service-card">
                  <h4>{service.name}</h4>
                  <p>{service.description}</p>
                  <p className="price">{service.price} ₽</p>
                  <button>Записаться</button>
                </div>
              ))
            ) : (
              !loading && !error && <p>Услуг пока нет.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2026 Система онлайн-записи</p>
      </footer>
    </div>
  )
}

export default App
