import React, { useEffect, useState } from 'react';
import api from '../utils/api.js';

interface Booking {
  id: number;
  service_name: string;
  price: number;
  booking_date: string;
  status: string;
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const response = await api.get('/my-bookings');
      setBookings(response.data);
    } catch (err) {
      setError('Ошибка при загрузке ваших записей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm('Вы уверены, что хотите отменить запись?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      alert('Ошибка при отмене записи');
    }
  };

  return (
    <div className="container">
      <h2>Мои записи</h2>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">{error}</p>}
      
      {!loading && bookings.length === 0 && <p>У вас пока нет записей.</p>}

      <div className="bookings-list">
        {bookings.map(booking => (
          <div key={booking.id} className="booking-card">
            <div className="booking-info">
              <h4>{booking.service_name}</h4>
              <p>Дата и время: {new Date(booking.booking_date).toLocaleString()}</p>
              <p>Цена: {booking.price} ₽</p>
              <p>Статус: <span className={`status ${booking.status}`}>{booking.status}</span></p>
            </div>
            <button className="delete-btn" onClick={() => handleCancel(booking.id)}>Отменить запись</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;
