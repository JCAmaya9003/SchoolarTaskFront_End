import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/UseFetch';
import usePost from '../hooks/UsePost';
import useUpdate from '../hooks/UseUpdate';
import useDelete from '../hooks/UseDelete';
import FormInput from './FormInput';
import { config } from '../utils/ConfigUtils';
import '../assets/form.css';

import '../assets/form.css';



const ParentAdmin = () => {
  const [parents, setParents] = useState([]);
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    fecha_nacimiento: '',
    rolNombre: 'Padre',
    genero: '',
    domicilio: '',
    nacionalidad: '',
    telefono: '',
    telefono_trabajo: '',
    lugar_trabajo: '',
    profesion: '',
  });

  const { data, error, isLoading } = useFetch(`${config.backUrl}/api/parents`);
  const { postData: createParent } = usePost(`${config.backUrl}/api/parents`);
  const { updateData: updateParent } = useUpdate(`${config.backUrl}/api/parents`);
  const { deleteData } = useDelete(`${config.backUrl}/api/parents`);

  useEffect(() => {
    if (data) {
      setParents(data);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParent) {
        await updateParent({ ...formData, email: editingParent.email });
        alert('Parent updated successfully!');
      } else {
        await createParent(formData);
        alert('Parent created successfully!');
      }
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        fecha_nacimiento: '',
        rolNombre: 'Padre',
        genero: '',
        domicilio: '',
        nacionalidad: '',
        telefono: '',
        telefono_trabajo: '',
        lugar_trabajo: '',
        profesion: '',
      });
      setEditingParent(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (email) => {
    try {
      await deleteData({ email });
      alert('Parent deleted successfully!');
    } catch (error) {
      alert('Error deleting parent: ' + error.message);
    }
  };

  const handleEdit = (parent) => {
    setEditingParent(parent);
    setFormData(parent);
  };

  return (
    <div>
      <h1>Parent Management</h1>
      {isLoading && <p>Loading parents...</p>}
      {error && <p>Error loading parents: {error.message}</p>}
      <ul>
        {parents.map((parent) => (
          <li key={parent.email}>
            {parent.nombre} {parent.apellido} - {parent.email}
            <button onClick={() => handleDelete(parent.email)}>Delete</button>
            <button onClick={() => handleEdit(parent)}>Edit</button>
          </li>
        ))}
      </ul>

      <h3>{editingParent ? 'Edit Parent' : 'Create New Parent'}</h3>
      <form onSubmit={handleSubmit}>
        <FormInput name="nombre" label="Nombre" value={formData.nombre} onChange={handleChange} required />
        <FormInput name="apellido" label="Apellido" value={formData.apellido} onChange={handleChange} required />
        <FormInput name="email" label="Email" value={formData.email} onChange={handleChange} type="email" required />
        <FormInput name="password" label="Password" value={formData.password} onChange={handleChange} type="password" required />
        <FormInput name="fecha_nacimiento" label="Fecha de Nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} type="date" required />
        <label htmlFor="genero">Género</label>
        <select name="genero" value={formData.genero} onChange={handleChange} required>
          <option value="">Seleccione</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
        </select>
        <FormInput name="domicilio" label="Domicilio" value={formData.domicilio} onChange={handleChange} required />
        <FormInput name="nacionalidad" label="Nacionalidad" value={formData.nacionalidad} onChange={handleChange} required />
        <FormInput name="telefono" label="Teléfono" value={formData.telefono} onChange={handleChange} required />
        <FormInput name="telefono_trabajo" label="Teléfono de Trabajo" value={formData.telefono_trabajo} onChange={handleChange} required />
        <FormInput name="lugar_trabajo" label="Lugar de Trabajo" value={formData.lugar_trabajo} onChange={handleChange} required />
        <FormInput name="profesion" label="Profesión" value={formData.profesion} onChange={handleChange} required />
        <button type="submit">{editingParent ? 'Update Parent' : 'Create Parent'}</button>
      </form>
    </div>
  );
};

export default ParentAdmin;
