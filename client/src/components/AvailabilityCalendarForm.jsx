import { useState, useEffect } from 'react';

function AvailabilityCalendarForm({ value = [], onChange, disabled = false }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periods, setPeriods] = useState(value || []);

  useEffect(() => {
    setPeriods(value || []);
  }, [value]);

  const addPeriod = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        alert('La date de début doit être avant la date de fin');
        return;
      }

      const newPeriod = { startDate, endDate };
      const updatedPeriods = [...periods, newPeriod];
      setPeriods(updatedPeriods);
      onChange(updatedPeriods);
      setStartDate('');
      setEndDate('');
    }
  };

  const removePeriod = (idx) => {
    const updatedPeriods = periods.filter((_, i) => i !== idx);
    setPeriods(updatedPeriods);
    onChange(updatedPeriods);
  };

  return (
    <div className="availability-form-container">
      <h3>📅 Gérer les disponibilités</h3>

      <div className="date-input-group">
        <div>
          <label>Date de début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label>Date de fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={disabled}
          />
        </div>
        <button 
          type="button" 
          onClick={addPeriod}
          disabled={disabled}
          className="add-period-btn"
        >
          ➕ Ajouter période
        </button>
      </div>

      {periods.length > 0 && (
        <div className="periods-list">
          <h4>Périodes ajoutées ({periods.length})</h4>
          {periods.map((period, idx) => (
            <div key={idx} className="period-item">
              <span className="period-dates">
                {new Date(period.startDate).toLocaleDateString('fr-FR')} → {new Date(period.endDate).toLocaleDateString('fr-FR')}
              </span>
              <button
                type="button"
                onClick={() => removePeriod(idx)}
                disabled={disabled}
                className="remove-period-btn"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {periods.length === 0 && (
        <p className="empty-periods">Aucune période ajoutée</p>
      )}
    </div>
  );
}

export default AvailabilityCalendarForm;
