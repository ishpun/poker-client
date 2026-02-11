const variants = {
  primary: { background: '#2196F3', color: '#fff' },
  secondary: { background: '#ccc', color: '#000' },
  success: { background: '#4CAF50', color: '#fff' },
  warning: { background: '#FF9800', color: '#fff' },
  danger: { background: '#d32f2f', color: '#fff' },
};

export default function Button({ variant = 'primary', children, style, ...props }) {
  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontWeight: variant === 'primary' || variant === 'warning' || variant === 'danger' ? 500 : undefined,
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
