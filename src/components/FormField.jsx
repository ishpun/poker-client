const blockStyle = { marginBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: 14 };
const inputStyle = { display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 };
const errorStyle = { color: 'red', fontSize: 14 };

export default function FormField({ id, label, error, ...inputProps }) {
  return (
    <div style={blockStyle}>
      {label && <label htmlFor={id} style={labelStyle}>{label}</label>}
      <input id={id} style={inputStyle} {...inputProps} />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
