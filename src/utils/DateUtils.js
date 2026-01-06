export const formatDate = (dateString, messageFormat = 'Día reservado YYYY-MM-DD Hora reservada HH:MM') => {
  const date = new Date(dateString);
  
  // Extracting the components of the date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Replace placeholders in the message format
  const formattedMessage = messageFormat
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('MM', minutes);

  return formattedMessage;
};