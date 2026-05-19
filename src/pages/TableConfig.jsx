import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getTablesUrl } from '../api/tables';
import Button from '../components/Button';
import FormField from '../components/FormField';

const defaultValues = {
  tableName: '',
  seatCount: 6,
  minPlayers: 2,
  smallBlind: 10,
  bigBlind: 20,
  turnTimer: 0,
  isBotGame: false,
  maxBotCount: '',
  botJoinInterval: 10,
  serviceCharge: 12,
  botActionMinPercent: 10,
  botActionMaxPercent: 15,
  minBuyIn: 100,
  entryFee: 100,
};

export default function TableConfig() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue;
    
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'tableName') {
      processedValue = value;
    } else if (name === 'maxBotCount' || name === 'botJoinInterval' || name === 'serviceCharge' || name === 'minBuyIn' || name === 'entryFee') {
      processedValue = value === '' ? '' : Number(value);
    } else if (name === 'turnTimer') {
      processedValue = value === '' ? 0 : Number(value);
    } else {
      processedValue = value === '' ? '' : Number(value);
    }
    
    setForm((prev) => {
      const next = { ...prev, [name]: processedValue };
      if (name === 'bigBlind' && processedValue !== '') {
        next.minBuyIn = Number(processedValue) * 5;
      }
      return next;
    });
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
    const turnTimer = Number(form.turnTimer);
    if (isNaN(turnTimer) || turnTimer < 0) next.turnTimer = 'Turn timer must be ≥ 0';
    if (form.isBotGame) {
      const maxBot = form.maxBotCount === '' ? NaN : Number(form.maxBotCount);
      const seatCountNum = Number(form.seatCount);
      if (isNaN(maxBot) || maxBot < 1) next.maxBotCount = 'Required when Bot game is enabled (min 1)';
      else if (!isNaN(seatCountNum) && maxBot > seatCountNum) next.maxBotCount = `Cannot exceed seat count (${seatCountNum})`;
      const botJoinInterval = form.botJoinInterval === '' ? NaN : Number(form.botJoinInterval);
      if (isNaN(botJoinInterval) || botJoinInterval < 1) next.botJoinInterval = 'Bot join interval must be at least 1 second';
    }
    const minBuyIn = Number(form.minBuyIn);
    if (isNaN(minBuyIn) || minBuyIn < 0) next.minBuyIn = 'Min buy-in must be ≥ 0';
    const entryFee = Number(form.entryFee);
    if (isNaN(entryFee) || entryFee < 0) next.entryFee = 'Entry fee must be ≥ 0';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!validate()) return;

    const seatCount = Number(form.seatCount);
    const payload = {
      tableName: form.tableName?.trim() || null,
      seatCount,
      minPlayers: Number(form.minPlayers),
      smallBlind: Number(form.smallBlind),
      bigBlind: Number(form.bigBlind),
      turnTimer: Number(form.turnTimer) || 0,
      isBotGame: Boolean(form.isBotGame),
      maxBotCount: form.isBotGame ? Number(form.maxBotCount) || 0 : null,
      botJoinInterval: form.isBotGame ? Number(form.botJoinInterval) || null : null,
      serviceCharge: Number(form.serviceCharge) || 12,
      botActionMinPercent: Number(form.botActionMinPercent) || 15,
      botActionMaxPercent: Number(form.botActionMaxPercent) || 20,
      minBuyIn: Number(form.minBuyIn) || 0,
      entryFee: Number(form.entryFee) || 0,
    };

    setLoading(true);
    try {
      await axios.post(getTablesUrl(), payload);
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
    <div className="table-config-page">
      <h1>Table configuration</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <FormField id="tableName" label="Table name (optional)" name="tableName" type="text" value={form.tableName} onChange={handleChange} error={errors.tableName} placeholder="e.g. Main table" />
          <FormField id="seatCount" label="Seat count (2–10)" name="seatCount" type="number" min={2} max={10} value={form.seatCount} onChange={handleChange} error={errors.seatCount} />
          <FormField id="minPlayers" label="Min players" name="minPlayers" type="number" min={2} value={form.minPlayers} onChange={handleChange} error={errors.minPlayers} />
          <FormField id="smallBlind" label="Small blind" name="smallBlind" type="number" min={0} value={form.smallBlind} onChange={handleChange} error={errors.smallBlind} />
          <FormField id="bigBlind" label="Big blind" name="bigBlind" type="number" min={0} value={form.bigBlind} onChange={handleChange} error={errors.bigBlind} />
          <FormField id="turnTimer" label="Turn timer (seconds, 0 = off)" name="turnTimer" type="number" min={0} value={form.turnTimer} onChange={handleChange} error={errors.turnTimer} />
          <FormField id="minBuyIn" label="Min Buy-in" name="minBuyIn" type="number" min={0} value={form.minBuyIn} onChange={handleChange} error={errors.minBuyIn} />
          <FormField id="entryFee" label="Entry fee" name="entryFee" type="number" min={0} value={form.entryFee} onChange={handleChange} error={errors.entryFee} />
          <FormField id="serviceCharge" label="Service charge (%)" name="serviceCharge" type="number" min={0} max={100} value={form.serviceCharge} onChange={handleChange} error={errors.serviceCharge} placeholder="e.g. 12" />
        </div>
        
        <div style={{ margin: '1rem 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" name="isBotGame" checked={form.isBotGame} onChange={handleChange} />
            <span>Bot game</span>
          </label>
        </div>

        {form.isBotGame && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem', marginBottom: '1rem' }}>
            <FormField
              id="maxBotCount"
              label="Max bot count (required for bot game)"
              name="maxBotCount"
              type="number"
              min={1}
              max={form.seatCount || 10}
              value={form.maxBotCount}
              onChange={handleChange}
              error={errors.maxBotCount}
              placeholder="e.g. 2"
            />
            <FormField
              id="botJoinInterval"
              label="Bot join interval (seconds)"
              name="botJoinInterval"
              type="number"
              min={1}
              value={form.botJoinInterval}
              onChange={handleChange}
              error={errors.botJoinInterval}
              placeholder="e.g. 5"
            />
            <FormField
              id="botActionMinPercent"
              label="Bot Action Min % of Turn Time (e.g. 15)"
              name="botActionMinPercent"
              type="number"
              min={1}
              max={100}
              value={form.botActionMinPercent}
              onChange={handleChange}
              error={errors.botActionMinPercent}
            />
            <FormField
              id="botActionMaxPercent"
              label="Bot Action Max % of Turn Time (e.g. 20)"
              name="botActionMaxPercent"
              type="number"
              min={1}
              max={100}
              value={form.botActionMaxPercent}
              onChange={handleChange}
              error={errors.botActionMaxPercent}
            />
          </div>
        )}
        
        {message.text && (
          <p style={{ color: message.type === 'error' ? 'red' : 'green', marginBottom: '1rem' }}>{message.text}</p>
        )}
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save table config'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/tables')}>Back</Button>
        </div>
      </form>
    </div>
  );
}
