import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { tablesApiUrl, getTableByIdUrl } from '../api/tables';
import Modal from '../components/Modal';
import Button from '../components/Button';
import FormField from '../components/FormField';

let tablesFetchPromise = null;

function normalizeTablesList(res) {
  const raw = res.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.tables)) return raw.tables;
  return [];
}

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinLinksModal, setJoinLinksModal] = useState({ show: false, tableId: null, playerIds: '', currency: 'USD', mode: 'DEMO', links: [] });
  const [editModal, setEditModal] = useState({ show: false, table: null, form: null, errors: {}, saving: false, message: '' });

  const fetchTables = () => {
    axios
      .get(tablesApiUrl)
      .then((res) => setTables(normalizeTablesList(res)))
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to fetch tables.'));
  };

  useEffect(() => {
    if (!tablesFetchPromise) tablesFetchPromise = axios.get(tablesApiUrl);
    const p = tablesFetchPromise;
    let cancelled = false;
    p.then((res) => {
      if (!cancelled) setTables(normalizeTablesList(res));
    }).catch((err) => {
      if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to fetch tables.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
      tablesFetchPromise = null;
    });
    return () => { cancelled = true; };
  }, []);

  const openEdit = (t) => {
    setEditModal({
      show: true,
      table: t,
      form: {
        tableName: t.tableName ?? '',
        seatCount: t.seatCount ?? 6,
        minPlayers: t.minPlayers ?? 2,
        smallBlind: t.smallBlind ?? 10,
        bigBlind: t.bigBlind ?? 20,
        turnTimer: t.turnTimer ?? 0,
      },
      errors: {},
      saving: false,
      message: '',
    });
  };

  const closeEdit = () => setEditModal({ show: false, table: null, form: null, errors: {}, saving: false, message: '' });

  const handleDelete = (tableId) => {
    if (!window.confirm('Delete this table?')) return;
    axios
      .delete(getTableByIdUrl(tableId))
      .then(() => fetchTables())
      .catch((err) => setError(err.response?.data?.message || err.message || 'Failed to delete table.'));
  };

  const updateEditForm = (name, value) => {
    setEditModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [name]: name === 'tableName' ? value : (name === 'turnTimer' ? (value === '' ? 0 : Number(value)) : (value === '' ? '' : Number(value))),
      },
      errors: { ...prev.errors, [name]: null },
    }));
  };

  const validateEdit = () => {
    const form = editModal.form;
    const next = {};
    const seatCount = Number(form.seatCount);
    if (isNaN(seatCount) || seatCount < 2 || seatCount > 10) next.seatCount = 'Seat count must be between 2 and 10';
    const minPlayers = Number(form.minPlayers);
    if (isNaN(minPlayers) || minPlayers < 2) next.minPlayers = 'Min players must be at least 2';
    if (!next.minPlayers && !next.seatCount && minPlayers > seatCount) next.minPlayers = 'Min players cannot exceed seat count';
    const smallBlind = Number(form.smallBlind);
    const bigBlind = Number(form.bigBlind);
    if (isNaN(smallBlind) || smallBlind < 0) next.smallBlind = 'Small blind must be ≥ 0';
    if (isNaN(bigBlind) || bigBlind < 0) next.bigBlind = 'Big blind must be ≥ 0';
    if (!next.bigBlind && bigBlind < smallBlind) next.bigBlind = 'Big blind must be ≥ small blind';
    const turnTimer = Number(form.turnTimer);
    if (isNaN(turnTimer) || turnTimer < 0) next.turnTimer = 'Turn timer must be ≥ 0';
    setEditModal((prev) => ({ ...prev, errors: next }));
    return Object.keys(next).length === 0;
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setEditModal((prev) => ({ ...prev, message: '' }));
    if (!validateEdit()) return;
    const { table, form } = editModal;
    const seatCount = Number(form.seatCount);
    const payload = {
      tableName: form.tableName?.trim() || null,
      seatCount,
      minPlayers: Number(form.minPlayers),
      smallBlind: Number(form.smallBlind),
      bigBlind: Number(form.bigBlind),
      turnTimer: Number(form.turnTimer) || 0,
    };
    setEditModal((prev) => ({ ...prev, saving: true }));
    try {
      await axios.put(getTableByIdUrl(table.id), payload);
      setEditModal((prev) => ({ ...prev, message: 'Saved.', saving: false }));
      fetchTables();
      setTimeout(closeEdit, 1200);
    } catch (err) {
      setEditModal((prev) => ({
        ...prev,
        message: err.response?.data?.message || err.message || 'Failed to save.',
        saving: false,
      }));
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading tables…</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div className="tables-page">
      <div className="tables-header">
        <h1>Tables</h1>
        <Link to="/table-config" style={{ padding: '0.5rem 1rem', background: '#333', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
          New table config
        </Link>
      </div>

      <Modal
        open={joinLinksModal.show}
        onClose={() => setJoinLinksModal({ show: false, tableId: null, playerIds: '', currency: 'USD', mode: 'DEMO', links: [] })}
        title="Generate Join Links"
        maxWidth={600}
      >
        <div style={{ marginBottom: '0.5rem', fontSize: 14, color: '#666' }}>
          Table ID: <strong>{joinLinksModal.tableId}</strong>
        </div>
        <div className="modal-row" style={{ marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="currencySelect" style={{ display: 'block', marginBottom: '0.5rem', fontSize: 14 }}>
              Currency:
            </label>
            <select
              id="currencySelect"
              value={joinLinksModal.currency}
              onChange={(e) => setJoinLinksModal((prev) => ({ ...prev, currency: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem', fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
              <option value="PC">PC</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="modeSelect" style={{ display: 'block', marginBottom: '0.5rem', fontSize: 14 }}>
              Mode:
            </label>
            <select
              id="modeSelect"
              value={joinLinksModal.mode}
              onChange={(e) => setJoinLinksModal((prev) => ({ ...prev, mode: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem', fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="DEMO">DEMO</option>
              <option value="REAL">REAL</option>
            </select>
          </div>
        </div>
        <label htmlFor="playerIdsInput" style={{ display: 'block', marginBottom: '0.5rem', fontSize: 14 }}>
          Enter Player IDs (one per line or comma-separated):
        </label>
        <textarea
          id="playerIdsInput"
          value={joinLinksModal.playerIds}
          onChange={(e) => setJoinLinksModal((prev) => ({ ...prev, playerIds: e.target.value }))}
          placeholder="player-1&#10;player-2&#10;player-3"
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', fontSize: 14, minHeight: '100px', fontFamily: 'monospace', border: '1px solid #ddd', borderRadius: 4 }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Button
            onClick={() => {
              const playerIds = joinLinksModal.playerIds.split(/[\n,]+/).map((id) => id.trim()).filter(Boolean);
              if (playerIds.length === 0) return;
              const params = new URLSearchParams();
              params.set('currency', joinLinksModal.currency);
              params.set('mode', joinLinksModal.mode);
              const queryString = params.toString();
              setJoinLinksModal((prev) => ({ ...prev, links: playerIds.map((playerId) => ({ playerId, url: `/play/${prev.tableId}/${playerId}?${queryString}` })) }));
            }}
          >
            Generate Links
          </Button>
          <Button variant="secondary" onClick={() => setJoinLinksModal({ show: false, tableId: null, playerIds: '', currency: 'USD', mode: 'DEMO', links: [] })}>
            Close
          </Button>
        </div>
        {joinLinksModal.links.length > 0 && (
          <div>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Join Links:</h4>
            <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: '1rem', background: '#f9f9f9' }}>
              {joinLinksModal.links.map((link, idx) => (
                <div key={idx} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: idx < joinLinksModal.links.length - 1 ? '1px solid #eee' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: '0.25rem' }}>Player: <strong>{link.playerId}</strong></div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#4CAF50', color: '#fff', textDecoration: 'none', borderRadius: 4, fontSize: 14 }}>
                    Join Game
                  </a>
                  <div style={{ marginTop: '0.25rem', fontSize: 11, color: '#999', fontFamily: 'monospace', wordBreak: 'break-all' }}>{window.location.origin}{link.url}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={editModal.show && !!editModal.table && !!editModal.form} onClose={closeEdit} title="Edit table config">
        {editModal.table && editModal.form && (
          <>
            <div style={{ marginBottom: '0.5rem', fontSize: 14, color: '#666' }}>Table ID: <strong>{editModal.table.id}</strong></div>
            <form onSubmit={submitEdit}>
              <FormField
                id="editTableName"
                label="Table name (optional)"
                type="text"
                name="tableName"
                value={editModal.form.tableName}
                onChange={(e) => updateEditForm('tableName', e.target.value)}
                error={editModal.errors.tableName}
                placeholder="e.g. Main table"
              />
              <FormField
                id="editSeatCount"
                label="Seat count (2–10)"
                type="number"
                name="seatCount"
                min={2}
                max={10}
                value={editModal.form.seatCount}
                onChange={(e) => updateEditForm('seatCount', e.target.value)}
                error={editModal.errors.seatCount}
              />
              <FormField
                id="editMinPlayers"
                label="Min players"
                type="number"
                name="minPlayers"
                min={2}
                value={editModal.form.minPlayers}
                onChange={(e) => updateEditForm('minPlayers', e.target.value)}
                error={editModal.errors.minPlayers}
              />
              <FormField
                id="editSmallBlind"
                label="Small blind"
                type="number"
                name="smallBlind"
                min={0}
                value={editModal.form.smallBlind}
                onChange={(e) => updateEditForm('smallBlind', e.target.value)}
                error={editModal.errors.smallBlind}
              />
              <FormField
                id="editBigBlind"
                label="Big blind"
                type="number"
                name="bigBlind"
                min={0}
                value={editModal.form.bigBlind}
                onChange={(e) => updateEditForm('bigBlind', e.target.value)}
                error={editModal.errors.bigBlind}
              />
              <FormField
                id="editTurnTimer"
                label="Turn timer (seconds, 0 = off)"
                type="number"
                name="turnTimer"
                min={0}
                value={editModal.form.turnTimer}
                onChange={(e) => updateEditForm('turnTimer', e.target.value)}
                error={editModal.errors.turnTimer}
              />
              {editModal.message && (
                <p style={{ color: editModal.message === 'Saved.' ? 'green' : 'red', marginBottom: '1rem', fontSize: 14 }}>{editModal.message}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button type="submit" disabled={editModal.saving}>{editModal.saving ? 'Saving…' : 'Save'}</Button>
                <Button type="button" variant="secondary" onClick={closeEdit}>Cancel</Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={editModal.saving}
                  onClick={() => {
                    if (!window.confirm('Delete this table?')) return;
                    axios.delete(getTableByIdUrl(editModal.table.id)).then(() => {
                      closeEdit();
                      fetchTables();
                    }).catch((err) => setEditModal((prev) => ({ ...prev, message: err.response?.data?.message || err.message || 'Failed to delete.' })));
                  }}
                >
                  Delete
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {tables.length === 0 ? (
        <p style={{ color: '#666' }}>No tables yet. Create one from Table configuration.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tables.map((t) => (
            <li key={t.id} className="tables-list-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.id ?? '—'}</div>
                <div style={{ fontSize: 14, color: '#555' }}>
                  Seats: {t.seatCount ?? '—'} · Min: {t.minPlayers ?? 2} · Blinds: {t.smallBlind ?? '—'}/{t.bigBlind ?? '—'}
                </div>
              </div>
              <div className="tables-list-item-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <Button onClick={() => setJoinLinksModal({ show: true, tableId: t.id, playerIds: '', currency: 'USD', mode: 'DEMO', links: [] })}>
                  Generate Join Links
                </Button>
                <Button variant="warning" onClick={() => openEdit(t)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(t.id)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
