import React, { useState, useEffect, useCallback } from 'react';
import useFetch from '../hooks/UseFetch';
import usePost from '../hooks/UsePost';
import useDelete from '../hooks/UseDelete';
import FormInput from './FormInput';
import { config } from '../utils/ConfigUtils';

const backUrl = config.backUrl;

const SubjectAdmin = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
  });

  const { data, error, isLoading } = useFetch(`${config.backUrl}/api/subjects`);
  const { postData: createSubject } = usePost();
  const { deleteData } = useDelete();

  useEffect(() => {
    if (data) {
      setSubjects(data);
    }
  }, [data]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      await createSubject(`${backUrl}/api/subjects`, formData);
      alert('Subject created successfully!');
      setFormData({ nombre: '' });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }, [formData, createSubject]);

  const handleDelete = useCallback(async (nombre) => {
    try {
      await deleteData(`${backUrl}/api/subjects`, { nombre });
      alert('Subject deleted successfully!');
    } catch (error) {
      alert('Error deleting subject: ' + error.message);
    }
  }, [deleteData]);

  return (
    <div>
      <h1>Subject Management</h1>
      {isLoading && <p>Loading subjects...</p>}
      {error && <p>Error loading subjects: {error.message}</p>}
      <ul>
        {subjects.map((subject) => (
          <li key={subject.nombre}>
            {subject.nombre}
            <button onClick={() => handleDelete(subject.nombre)}>Delete</button>
          </li>
        ))}
      </ul>

      <h3>Create New Subject</h3>
      <form onSubmit={handleSubmit}>
        <FormInput name="nombre" label="Nombre" value={formData.nombre} onChange={handleChange} required />
        <button type="submit">Create Subject</button>
      </form>
    </div>
  );
};

export default SubjectAdmin;