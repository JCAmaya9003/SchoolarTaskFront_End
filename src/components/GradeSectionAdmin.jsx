import React, { useState, useEffect } from 'react';
import useFetch from '../hooks/UseFetch';
import usePost from '../hooks/UsePost';
import useDelete from '../hooks/UseDelete';
import FormInput from './FormInput';
import { config } from '../utils/ConfigUtils';



const GradeSectionAdmin = () => {
  const [gradeSections, setGradeSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    grado: '',
    seccion: '',
    materias: [],
  });

  const { data: gradeSectionsData } = useFetch(`${config.backUrl}/api/gradeSections/all`);
  const { data: subjectsData } = useFetch(`${config.backUrl}/api/subjects`);
  const { postData: createGradeSection } = usePost();
  const { deleteData: deleteGradeSection } = useDelete();
  const [isSubjectRequired, setIsSubjectRequired] = useState(false);

  useEffect(() => {
    if (gradeSectionsData) {
      setGradeSections(gradeSectionsData);
    }
  }, [gradeSectionsData]);

  useEffect(() => {
    if (subjectsData) {
      setSubjects(subjectsData);
    }
  }, [subjectsData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData((prevData) => ({
        ...prevData,
        materias: [...prevData.materias, value], 
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        materias: prevData.materias.filter((materia) => materia !== value), // Remove unselected subject
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.materias.length === 0) {
      setIsSubjectRequired(true);
      return; 
    } else {
      setIsSubjectRequired(false);
    }

    try {
      await createGradeSection(`${config.backUrl}/api/gradeSections/create`, formData);
      alert('Grade and section created successfully!');
      resetForm();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (grado, seccion) => {
    try {
      await deleteGradeSection(`${config.backUrl}/api/gradeSections/delete`, { grado, seccion });
      alert('Grade and section deleted successfully!');
    } catch (error) {
      alert('Error deleting grade and section: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      grado: '',
      seccion: '',
      materias: [],
    });
  };

  return (
    <div>
      <h1>Grade and Section Management</h1>
      <form onSubmit={handleSubmit}>
        <FormInput name="grado" label="Grado" value={formData.grado} onChange={handleChange} required />
        <FormInput name="seccion" label="Sección" value={formData.seccion} onChange={handleChange} required />
        
        <label>Materias</label>
        <div>
          {subjects.map((subject) => (
            <div key={subject._id}>
              <input
                type="checkbox"
                value={subject.nombre}
                checked={formData.materias.includes(subject.nombre)} 
                onChange={handleCheckboxChange}
              />
              <label>{subject.nombre}</label>
            </div>
          ))}
        </div>
        {isSubjectRequired && <p style={{ color: 'red' }}>Please select at least one subject.</p>}
        <button type="submit">Create Grade Section</button>
      </form>

      <h3>Existing Grade Sections</h3>
      <ul>
        {gradeSections.map((gradeSection) => (
          <li key={gradeSection._id}>
            {gradeSection.grado} - {gradeSection.seccion} 
            <button onClick={() => handleDelete(gradeSection.grado, gradeSection.seccion)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GradeSectionAdmin;