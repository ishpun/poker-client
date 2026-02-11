import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { tablesApiUrl } from '../api/tables';
import Button from '../components/Button';
import FormField from '../components/FormField';

const defaultValues = {
  seatCount: 6,
  minPlayers: 2,
  smallBlind: 10,
  bigBlind: 20,
};

export default function TableConfig() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const next = {};
    const seatCount = Number(form.seatCount);
    if (isNaN(seatCount) || seatCount < 2 || seatCount > 10) {
      next.seatCount = 'Seat count must be between 2 and 10';
    }
    const minPlayers = Number(form.minPlayers);
    if (isNaN(minPlayers) || minPlayers < 2) next.minPlayers = 'Min players must be at least 2';
    if (!next.minPlayers && !next.seatCount && minPlayers > seatCount) {
      next.minPlayers = 'Min players cannot exceed seat count';
    }
    const smallBlind = Number(form.smallBlind);
    const bigBlind = Number(form.bigBlind);
    if (isNaN(smallBlind) || smallBlind < 0) next.smallBlind = 'Small blind must be ≥ 0';
    if (isNaN(bigBlind) || bigBlind < 0) next.bigBlind = 'Big blind must be ≥ 0';
    if (!next.bigBlind && bigBlind < smallBlind) {
      next.bigBlind = 'Big blind must be ≥ small blind';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!validate()) return;

    const seatCount = Number(form.seatCount);
    const payload = {
      seatCount,
      minPlayers: Number(form.minPlayers),
      smallBlind: Number(form.smallBlind),
      bigBlind: Number(form.bigBlind),
    };

    setLoading(true);
    try {
      await axios.post(tablesApiUrl, payload);
      setMessage({ type: 'success', text: 'Table config saved successfully.' });
      setForm(defaultValues);
    } catch (err) {
      const text = err.response?.data?.message || err.message || 'Failed to save table config.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Table configuration</h1>
      <form onSubmit={handleSubmit}>
        <FormField id="seatCount" label="Seat count (2–10)" name="seatCount" type="number" min={2} max={10} value={form.seatCount} onChange={handleChange} error={errors.seatCount} />
        <FormField id="minPlayers" label="Min players" name="minPlayers" type="number" min={2} value={form.minPlayers} onChange={handleChange} error={errors.minPlayers} />
        <FormField id="smallBlind" label="Small blind" name="smallBlind" type="number" min={0} value={form.smallBlind} onChange={handleChange} error={errors.smallBlind} />
        <FormField id="bigBlind" label="Big blind" name="bigBlind" type="number" min={0} value={form.bigBlind} onChange={handleChange} error={errors.bigBlind} />
        {message.text && (
          <p style={{ color: message.type === 'error' ? 'red' : 'green', marginBottom: '1rem' }}>{message.text}</p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save table config'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/tables')}>Back</Button>
        </div>
      </form>
    </div>
  );
}
