import React from "react";

const ShowMessage = ({ message }) => {
  return (
    <div>
      <h2>{message.titulo || "No Title"}</h2>
      <p>{message.contenido || "No Content"}</p>
      <p>
        Atte: {message.usuario?.nombre || "Anonymous"} {message.usuario?.apellido || ""}
      </p>
    </div>
  );
};

export default ShowMessage;
