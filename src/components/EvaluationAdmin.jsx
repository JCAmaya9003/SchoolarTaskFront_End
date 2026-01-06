import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/UseFetch';
import usePost from '../hooks/UsePost';
import useDelete from '../hooks/UseDelete';
import FormInput from './FormInput';
import { config } from '../utils/ConfigUtils';

const backUrl = config.backUrl;

const EvaluationAdmin = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    nombreMateria: '',
    descripcion: '',
    fecha: '',
    peso: '',
  });

  const { data: evaluationsData, error: evaluationsError, isLoading: evaluationsLoading } = useFetch(`${backUrl}/api/evaluations`);
  const { data: subjectsData, error: subjectsError, isLoading: subjectsLoading } = useFetch(`${backUrl}/api/subjects`);
  const { postData: createEvaluation } = usePost();
  const { deleteData: deleteEvaluation } = useDelete();

  useEffect(() => {
    if (evaluationsData) {
      setEvaluations(evaluationsData);
    }
  }, [evaluationsData]);

  useEffect(() => {
    if (subjectsData) {
      setSubjects(subjectsData);
    }
  }, [subjectsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEvaluation(`${backUrl}/api/evaluations`, formData);
      alert('Evaluation created successfully!');
      setFormData({
        nombre: '',
        nombreMateria: '',
        descripcion: '',
        fecha: '',
        peso: '',
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (evaluation) => {
    try {
      await deleteEvaluation(`${backUrl}/api/evaluations`, {
        nombre: evaluation.nombre,
        nombreMateria: evaluation.materia.nombre,
      });
      alert('Evaluation deleted successfully!');
    } catch (error) {
      alert('Error deleting evaluation: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Evaluation Management</h1>
      {evaluationsLoading && <p>Loading evaluations...</p>}
      {evaluationsError && <p>Error loading evaluations: {evaluationsError.message}</p>}
      {subjectsLoading && <p>Loading subjects...</p>}
      {subjectsError && <p>Error loading subjects: {subjectsError.message}</p>}

      <h3>Create New Evaluation</h3>
      <form onSubmit={handleSubmit}>
        <FormInput name="nombre" label="Nombre" value={formData.nombre} onChange={handleChange} required />
        <label htmlFor="nombreMateria">Materia</label>
        <select name="nombreMateria" value={formData.nombreMateria} onChange={handleChange} required>
          <option value="">Seleccione una materia</option>
          {subjects.map((subject) => (
            <option key={subject.nombre} value={subject.nombre}>{subject.nombre}</option>
          ))}
        </select>
        <FormInput name="descripcion" label="Descripción" value={formData.descripcion} onChange={handleChange} required />
        <FormInput name="fecha" label="Fecha" value={formData.fecha} onChange={handleChange} type="date" required />
        <FormInput name="peso" label="Peso" value={formData.peso} onChange={handleChange} type="number" step="0.1" min="0" max="10" required />
        <button type="submit">Create Evaluation</button>
      </form>

      <h3>Existing Evaluations</h3>
      <ul>
        {evaluations.map((evaluation) => (
          <li key={evaluation.nombre}>
            {evaluation.nombre} - {evaluation.nombreMateria} - {evaluation.descripcion} - {evaluation.fecha} - {evaluation.peso}
            <button onClick={() => handleDelete(evaluation)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EvaluationAdmin;