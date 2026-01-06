const FormInput = ({
  name,
  label,
  value,
  onChange,
  type,
  as = "input",
  placeholder=""
}) => {

  let Component;
  //para crear el apartado de noticias y eventos, esta condición será importante
  if (as === "textarea") {
    Component = "textarea";
  } else {
    Component = "input";
  }

  return (
    <div>
      <label htmlFor={name}> {label} </label>
      <Component type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} required/>
    </div>
  );
}

export default FormInput;