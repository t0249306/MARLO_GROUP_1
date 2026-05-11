import React, { useEffect, useState } from 'react';
import api from '../utils/api.js';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

const Home: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        setServices(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке услуг:', err);
        setError('Не удалось загрузить список услуг.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
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
                <button onClick={() => alert('Функционал записи будет доступен на 3 неделе!')}>
                  Записаться
                </button>
              </div>
            ))
          ) : (
            !loading && !error && <p>Услуг пока нет.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
