import React, { useEffect, useState } from 'react';
import api from '../utils/api.js';
import { useNavigate } from 'react-router-dom';

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
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  
  const navigate = useNavigate();
  const user = localStorage.getItem('user');

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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsBooking(true);
    try {
      await api.post('/bookings', {
        service_id: selectedService?.id,
        booking_date: bookingDate
      });
      alert('Запись успешно создана!');
      setSelectedService(null);
      setBookingDate('');
      navigate('/bookings');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при создании записи');
    } finally {
      setIsBooking(false);
    }
  };

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
                <button onClick={() => setSelectedService(service)}>
                  Записаться
                </button>
              </div>
            ))
          ) : (
            !loading && !error && <p>Услуг пока нет.</p>
          )}
        </div>
      </section>

      {selectedService && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Запись на услугу: {selectedService.name}</h3>
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label>Выберите дату и время:</label>
                <input 
                  type="datetime-local" 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)} 
                  required 
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="modal-buttons">
                <button type="submit" disabled={isBooking}>
                  {isBooking ? 'Записываем...' : 'Подтвердить запись'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setSelectedService(null)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
