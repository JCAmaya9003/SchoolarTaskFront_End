import React, { useState, useEffect } from "react";
import useFetch from "../hooks/UseFetch";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import useDelete from "../hooks/UseDelete";
import FormInput from "./FormInput";
import { config } from "../utils/ConfigUtils";
import '../assets/form.css'

const backUrl = config.backUrl;

const StudentAdmin = () => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    fecha_nacimiento: "",
    rolNombre: "Estudiante",
    genero: "",
    domicilio: "",
    nacionalidad: "",
    email_padre: "",
    grado: "",
    seccion: "",
    alergias: "",
    condiciones_medicas: "",
    contacto_emergencia: {
      nombre: "",
      telefono: "",
    },
  });

  const { data, error, isLoading } = useFetch(`${config.backUrl}/api/students`);
  const { postData: createStudent } = usePost(`${config.backUrl}/api/students`);
  const { updateData: updateStudent } = useUpdate(`${config.backUrl}/api/students`);
  const { deleteData } = useDelete(`${config.backUrl}/api/students`);

  useEffect(() => {
    if (data) {
      setStudents(data);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested object for contacto_emergencia
    if (name.startsWith("contacto_emergencia")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contacto_emergencia: {
          ...prev.contacto_emergencia,
          [field]: value,
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent({ ...formData, email: editingStudent.email });
        alert("Student updated successfully!");
      } else {
        await createStudent(formData);
        alert("Student created successfully!");
      }
      // Reset form
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        fecha_nacimiento: "",
        rolNombre: "Estudiante",
        genero: "",
        domicilio: "",
        nacionalidad: "",
        email_padre: "",
        grado: "",
        seccion: "",
        alergias: "",
        condiciones_medicas: "",
        contacto_emergencia: {
          nombre: "",
          telefono: "",
        },
      });
      setEditingStudent(null);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDelete = async (email) => {
    try {
      await deleteData({ email });
      alert("Student deleted successfully!");
    } catch (error) {
      alert("Error deleting student: " + error.message);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData(student);
  };

  return (
    <div>
      <h1>Student Management</h1>
      {isLoading && <p>Loading students...</p>}
      {error && <p>Error loading students: {error.message}</p>}
      <ul>
        {students
          .filter((student) => student !== undefined)
          .map((student) => (
            <li key={student.email}>
              {student.nombre} {student.apellido} - {student.email}
              <button onClick={() => handleDelete(student.email)}>Delete</button>
              <button onClick={() => handleEdit(student)}>Edit</button>
            </li>
          ))}
      </ul>

      <h3>{editingStudent ? "Edit Student" : "Create New Student"}</h3>
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
        <FormInput name="email_padre" label="Email del Padre" value={formData.email_padre} onChange={handleChange} required />
        <FormInput name="grado" label="Grado" value={formData.grado} onChange={handleChange} required />
        <FormInput name="seccion" label="Sección" value={formData.seccion} onChange={handleChange} required />
        <FormInput name="alergias" label="Alergias" value={formData.alergias} onChange={handleChange} />
        <FormInput name="condiciones_medicas" label="Condiciones Médicas" value={formData.condiciones_medicas} onChange={handleChange} />
        <h4>Contacto de Emergencia</h4>
        <FormInput
          name="contacto_emergencia.nombre"
          label="Nombre"
          value={formData.contacto_emergencia.nombre}
          onChange={handleChange}
          required
        />
        <FormInput
          name="contacto_emergencia.telefono"
          label="Teléfono"
          value={formData.contacto_emergencia.telefono}
          onChange={handleChange}
          required
        />
        <button type="submit">{editingStudent ? "Update Student" : "Create Student"}</button>
      </form>
    </div>
  );
};

export default StudentAdmin;
