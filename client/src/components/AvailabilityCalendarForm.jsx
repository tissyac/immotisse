import { useState, useEffect } from 'react';
import CalendarGrid from './CalendarGrid';
import '../calendar-form-styles.css';
import '../calendar-styles.css';

function AvailabilityCalendarForm({ value = [], onChange, disabled = false }) {
  const [periods, setPeriods] = useState(value || []);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPeriods(value || []);
  }, [value]);

  const addPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) {
      setMessage('Sélectionnez une période valide dans le calendrier.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setMessage('La date de début doit être avant la date de fin.');
      return;
    }

    const newPeriod = { startDate, endDate };
    const updatedPeriods = [...periods, newPeriod];
    setPeriods(updatedPeriods);
    onChange(updatedPeriods);
    setMessage('Période ajoutée au calendrier.');
  };

  const removePeriod = (idx) => {
    const updatedPeriods = periods.filter((_, i) => i !== idx);
    setPeriods(updatedPeriods);
    onChange(updatedPeriods);
    setMessage('Période supprimée.');
  };

  return (
    <div className="availability-form-container">
      <h3>📅 Calendrier des indisponibilités</h3>
      <p className="calendar-instruction">
        Sélectionnez une plage dans le calendrier pour bloquer les dates indisponibles. Les jours rouges sont déjà réservés.
      </p>

      <CalendarGrid
        reservedPeriods={periods}
        onDateSelect={addPeriod}
        disabled={disabled}
      />

      <div className="reserved-periods-section">
        <h4>Périodes bloquées</h4>
        {periods.length > 0 ? (
          <div className="reserved-chips">
            {periods.map((period, idx) => (
              <div key={idx} className="reserved-chip">
                <span>
                  {new Date(period.startDate).toLocaleDateString('fr-FR')} → {new Date(period.endDate).toLocaleDateString('fr-FR')}
                </span>
                <button
                  type="button"
                  className="remove-period-btn"
                  onClick={() => removePeriod(idx)}
                  disabled={disabled}
                  title="Supprimer cette période"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-periods">Aucune période bloquée n'a encore été définie.</p>
        )}
      </div>

      {message && <div className="availability-message">{message}</div>}
    </div>
  );
}

export default AvailabilityCalendarForm;
