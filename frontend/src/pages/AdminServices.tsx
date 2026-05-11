import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
}

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (err) {
      setError('Ошибка при загрузке услуг');
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/services', { name, description, price: parseFloat(price) });
      setName('');
      setDescription('');
      setPrice('');
      fetchServices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при добавлении');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту услугу?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices();
    } catch (err) {
      setError('Ошибка при удалении');
    }
  };

  return (
    <div className="admin-services container">
      <h2>Управление услугами (Админ)</h2>
      {error && <p className="error">{error}</p>}

      <section className="add-service-form">
        <h3>Добавить новую услугу</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Название:</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Описание:</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Цена:</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <button type="submit">Добавить</button>
        </form>
      </section>

      <section className="services-list">
        <h3>Список услуг</h3>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Цена</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.price} ₽</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(s.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminServices;
