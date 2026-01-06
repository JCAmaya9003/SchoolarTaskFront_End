import React, { useState, useEffect, useContext } from 'react';
import useFetch from '../hooks/UseFetch';
import usePost from '../hooks/UsePost';
import useUpdate from '../hooks/UseUpdate';
import useDelete from '../hooks/UseDelete';
import FormInput from './FormInput';
import { config } from '../utils/ConfigUtils';
import { AuthContext } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';



const ReservationAdmin = () => {
  const { token } = useContext(AuthContext); // Get the token from AuthContext
  const [places, setPlaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    lugar: '',
    usuarioEmail: '', // This will be populated automatically
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
  });
  const [editingReservation, setEditingReservation] = useState(null);

  const { data: placesData, error: placesError, isLoading: placesLoading } = useFetch(`${config.backUrl}/api/academic_places`);
  const { data: reservationsData, error: reservationsError, isLoading: reservationsLoading } = useFetch(`${config.backUrl}/api/reservations/all`);
  const { postData: createReservation } = usePost();
  const { updateData: updateReservation } = useUpdate();
  const { deleteData: deleteReservation } = useDelete();
  const { postData: placeName } = usePost();

  const fetchPlaceName = async (lugarId) => {
    try {
      const response = await placeName(`${config.backUrl}academic_place/get-name`, { lugarId });
      return response.nombre; 
    } catch (error) {
      console.error('Error fetching place name:', error);
      return null;
    }
  };

  useEffect(() => {
    if (placesData) {
      setPlaces(placesData);
    }
  }, [placesData]);

  useEffect(() => {
    if (reservationsData) {
      setReservations(reservationsData);
    }
  }, [reservationsData]);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      setFormData((prevData) => ({
        ...prevData,
        usuarioEmail: decodedToken.email, 
      }));
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReservation) {
        await updateReservation(`${config.backUrl}/api/reservations`, {
          ...formData,
          nuevoLugar: formData.lugar,
          nueva_fecha_inicio: formData.fecha_inicio,
          nueva_fecha_fin: formData.fecha_fin,
        });
        alert('Reservation updated successfully!');
      } else {
        await createReservation(`${config.backUrl}/api/reservations/create`, formData);
        alert('Reservation created successfully!');
      }
      setFormData({
        lugar: '',
        usuarioEmail: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
      });
      setEditingReservation(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (reservation) => {
    try {
      const nombreLugar = await fetchPlaceName(reservation.lugar._id);
      await deleteReservation(`${config.backUrl}/api/reservations`, {
        lugar: nombreLugar,
        usuarioEmail: reservation.usuarioEmail, 
      });
      alert('Reservation deleted successfully!');
    } catch (error) {
      alert('Error deleting reservation: ' + error.message);
    }
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      lugar: reservation.lugar._id,
      usuarioEmail: reservation.usuarioEmail,
      descripcion: reservation.descripcion,
      fecha_inicio: reservation.fecha_inicio,
      fecha_fin: reservation.fecha_fin,
    });
  };

  return (
    <div>
      <h1>Reservation Management</h1>
      {placesLoading && <p>Loading places...</p>}
      {placesError && <p>Error loading places: {placesError.message}</p>}
      {reservationsLoading && <p>Loading reservations...</p>}
      {reservationsError && <p>Error loading reservations: {reservationsError.message}</p>}

      <h3>Create New Reservation</h3>
      <form onSubmit={handleReservationSubmit}>
        <label htmlFor="lugar">Lugar</label>
        <select name="lugar" value={formData.lugar} onChange={handleChange} required>
          <option value="">Seleccione un lugar</option>
          {places.map((place) => (
            <option key={place._id} value={place._id}>{place.lugar}</option>
          ))}
        </select>
        <FormInput name="descripcion" label="Descripción" value={formData.descripcion} onChange={handleChange} as="textarea" required />
        <FormInput name="fecha_inicio" label="Fecha de Inicio" value={formData.fecha_inicio} onChange={handleChange} type="datetime-local" required />
        <FormInput name="fecha_fin" label="Fecha de Fin" value={formData.fecha_fin} onChange={handleChange} type="datetime-local" required />
        <button type="submit">
          {editingReservation ? 'Update Reservation' : 'Create Reservation'}
        </button>
      </form>

      <h3>Existing Reservations</h3>
      <ul>
        {reservations.map((reservation) => (
          <li key={reservation._id}>
            {reservation.lugar._id} - {reservation.usuario.email} - {reservation.descripcion} - {reservation.fecha_inicio} - {reservation.fecha_fin}
            <button onClick={() => handleEdit(reservation)}>Edit</button>
            <button onClick={() => handleDelete(reservation)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReservationAdmin;