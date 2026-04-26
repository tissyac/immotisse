import { useState, useEffect } from 'react';

function CalendarGrid({ reservedPeriods = [], onDateSelect, selectedStart, selectedEnd, disabled = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [tempStart, setTempStart] = useState(selectedStart);
  const [tempEnd, setTempEnd] = useState(selectedEnd);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateReserved = (date) => {
    const checkDate = new Date(date);
    return reservedPeriods.some(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return checkDate >= start && checkDate <= end;
    });
  };

  const isDateInRange = (date) => {
    if (!tempStart || !tempEnd) return false;
    const checkDate = new Date(date);
    const start = new Date(tempStart);
    const end = new Date(tempEnd);
    return checkDate >= start && checkDate <= end;
  };

  const isDateSelected = (date) => {
    const checkDate = new Date(date);
    if (tempStart && new Date(tempStart).toDateString() === checkDate.toDateString()) return 'start';
    if (tempEnd && new Date(tempEnd).toDateString() === checkDate.toDateString()) return 'end';
    return false;
  };

  const handleDateClick = (day) => {
    if (disabled) return;

    const clickedDate = new Date(currentYear, currentMonth, day);
    const dateStr = clickedDate.toISOString().split('T')[0];

    if (!tempStart || (tempStart && tempEnd)) {
      // Nouvelle sélection
      setTempStart(dateStr);
      setTempEnd(null);
    } else {
      // Fin de sélection
      if (new Date(dateStr) < new Date(tempStart)) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const confirmSelection = () => {
    if (tempStart && tempEnd) {
      onDateSelect(tempStart, tempEnd);
    }
  };

  const clearSelection = () => {
    setTempStart(null);
    setTempEnd(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();

    const days = [];

    // Jours vides du début
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      const reserved = isDateReserved(dateStr);
      const inRange = isDateInRange(dateStr);
      const selected = isDateSelected(dateStr);

      let className = 'calendar-day';
      if (isToday) className += ' today';
      if (isPast) className += ' past';
      if (reserved) className += ' reserved';
      if (inRange) className += ' in-range';
      if (selected === 'start') className += ' selected-start';
      if (selected === 'end') className += ' selected-end';

      days.push(
        <div
          key={day}
          className={className}
          onClick={() => !isPast && !reserved && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    setTempStart(selectedStart);
    setTempEnd(selectedEnd);
  }, [selectedStart, selectedEnd]);

  return (
    <div className="calendar-grid-container">
      <div className="calendar-header">
        <button onClick={prevMonth} disabled={disabled}>‹</button>
        <h3>{monthNames[currentMonth]} {currentYear}</h3>
        <button onClick={nextMonth} disabled={disabled}>›</button>
      </div>

      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {renderCalendar()}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color reserved"></div>
          <span>Réservé</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Sélectionné</span>
        </div>
      </div>

      {(tempStart || tempEnd) && (
        <div className="calendar-actions">
          <div className="selection-info">
            {tempStart && <span>Début: {new Date(tempStart).toLocaleDateString('fr-FR')}</span>}
            {tempEnd && <span>Fin: {new Date(tempEnd).toLocaleDateString('fr-FR')}</span>}
          </div>
          <div className="action-buttons">
            <button onClick={confirmSelection} disabled={!tempStart || !tempEnd || disabled}>
              Confirmer
            </button>
            <button onClick={clearSelection} disabled={disabled}>
              Effacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarGrid;