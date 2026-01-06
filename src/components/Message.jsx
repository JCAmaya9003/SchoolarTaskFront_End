import React from "react";
import '../assets/News.css'; // Importing CSS

const Message = ({ message, onDelete, setEditingNews }) => {
  const handleEditClick = () => {
    // Set the editing state to pass the selected message to FormNews for editing
    setEditingNews(message);
  };

  const handleDelete = () => {
    onDelete(message.usuario.email, message.titulo); // Call delete handler
  };

  return (
    <div className="news-item">
      <h2>{message.titulo}</h2>
      <p>{message.contenido}</p>
      <p>
        Atte: {message.usuario.nombre} {message.usuario.apellido}
      </p>
      <div className="buttons">
        <button className="edit-button" onClick={handleEditClick}>
          Editar
        </button>
        <button className="delete-button" onClick={handleDelete}>
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default Message;
