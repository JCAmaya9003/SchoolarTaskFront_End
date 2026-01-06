import React, { useState, useEffect } from "react";
import useFetch from "../hooks/UseFetch";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import useDelete from "../hooks/UseDelete";
import FormInput from "./FormInput";
import { config } from "../utils/ConfigUtils";
import "../assets/form.css";



const TeacherAdmin = () => {
  const [teachers, setTeachers] = useState([]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    fecha_nacimiento: "",
    rolNombre: "Profesor",
    genero: "",
    domicilio: "",
    nacionalidad: "",
    asignaciones: [
      {
        materias: [""],
        grado_secciones: { grado: "1", seccion: "A" },
      },
    ],
    telefono: "",
    especialidad: "",
  });

  const { data, error, isLoading } = useFetch(`${config.backUrl}/api/teachers`);
  const { postData: createTeacher } = usePost(`${config.backUrl}/api/teachers`);
  const { updateData: updateTeacher } = useUpdate(`${config.backUrl}/api/teachers`);
  const { deleteData } = useDelete(`${config.backUrl}/api/teachers`);

  useEffect(() => {
    if (data) {
      setTeachers(data);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAsignacionesChange = (index, field, value) => {
    const newAsignaciones = [...formData.asignaciones];
    if (field === "materias") {
      newAsignaciones[index].materias = value.split(",").map((item) => item.trim());
    } else {
      newAsignaciones[index][field] = value;
    }
    setFormData({ ...formData, asignaciones: newAsignaciones });
  };

  const handleGradoSeccionChange = (index, field, value) => {
    const newAsignaciones = [...formData.asignaciones];
    newAsignaciones[index].grado_secciones[field] = value;
    setFormData({ ...formData, asignaciones: newAsignaciones });
  };

  const addAsignacion = () => {
    setFormData({
      ...formData,
      asignaciones: [
        ...formData.asignaciones,
        {
          materias: [""],
          grado_secciones: { grado: "1", seccion: "A" },
        },
      ],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await updateTeacher({ ...formData, email: editingTeacher.email });
        alert("Teacher updated successfully!");
      } else {
        await createTeacher(formData);
        alert("Teacher created successfully!");
      }
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        fecha_nacimiento: "",
        rolNombre: "Profesor",
        genero: "",
        domicilio: "",
        nacionalidad: "",
        asignaciones: [
          {
            materias: [""],
            grado_secciones: { grado: "1", seccion: "A" },
          },
        ],
        telefono: "",
        especialidad: "",
      });
      setEditingTeacher(null);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleDelete = async (email) => {
    try {
      await deleteData({ email });
      alert("Teacher deleted successfully!");
    } catch (error) {
      alert("Error deleting teacher: " + error.message);
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData(teacher);
  };

  return (
    <div>
      <h1>Teacher Management</h1>
      {isLoading && <p>Loading teachers...</p>}
      {error && <p>Error loading teachers: {error.message}</p>}
      <ul>
        {teachers.map((teacher) => (
          <li key={teacher.email}>
            {teacher.nombre} {teacher.apellido} - {teacher.email}
            <button onClick={() => handleDelete(teacher.email)}>Delete</button>
            <button onClick={() => handleEdit(teacher)}>Edit</button>
          </li>
        ))}
      </ul>

      <h3>{editingTeacher ? "Edit Teacher" : "Create New Teacher"}</h3>
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
        <FormInput name="domicilio" label="Domicilio" value={formData.domicilio} onChange={handleChange} type="text" required />
        <FormInput name="nacionalidad" label="Nacionalidad" value={formData.nacionalidad} onChange={handleChange} type="text" required />
        <FormInput name="telefono" label="Teléfono" value={formData.telefono} onChange={handleChange} type="text" required />
        <FormInput name="especialidad" label="Especialidad" value={formData.especialidad} onChange={handleChange} type="text" required />

        {formData.asignaciones.map((asignacion, index) => (
          <div key={index}>
            <label htmlFor={`materias-${index}`}>Materias</label>
            <input
              id={`materias-${index}`}
              name="materias"
              value={asignacion.materias.join(", ")}
              onChange={(e) => handleAsignacionesChange(index, "materias", e.target.value)}
              type="text"
              placeholder="e.g., Matematicas, Fisica"
              required
            />
            <label>Grado</label>
            <select
              value={asignacion.grado_secciones.grado}
              onChange={(e) => handleGradoSeccionChange(index, "grado", e.target.value)}
              required
            >
              {[...Array(12).keys()].map((n) => (
                <option key={n + 1} value={n + 1}>
                  {n + 1}
                </option>
              ))}
            </select>
            <label>Sección</label>
            <select
              value={asignacion.grado_secciones.seccion}
              onChange={(e) => handleGradoSeccionChange(index, "seccion", e.target.value)}
              required
            >
              {["A", "B", "C", "D", "E", "F"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button type="button" onClick={addAsignacion}>
          Add Asignación
        </button>

        <button type="submit">{editingTeacher ? "Update Teacher" : "Create Teacher"}</button>
      </form>
    </div>
  );
};

export default TeacherAdmin;
