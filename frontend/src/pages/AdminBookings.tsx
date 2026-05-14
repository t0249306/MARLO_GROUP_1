import React, { useEffect, useState } from 'react';
import api from '../utils/api.js';

interface Booking {
  id: number;
  service_name: string;
  username: string;
  booking_date: string;
  status: string;
}

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/admin/all-bookings');
      setBookings(response.data);
    } catch (err) {
      alert('Ошибка при загрузке всех записей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  return (
    <div className="container">
      <h2>Все записи в системе (Админ)</h2>
      {loading && <p>Загрузка...</p>}
      
      <table>
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Услуга</th>
            <th>Дата и время</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>{b.username}</td>
              <td>{b.service_name}</td>
              <td>{new Date(b.booking_date).toLocaleString()}</td>
              <td><span className={`status ${b.status}`}>{b.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminBookings;
