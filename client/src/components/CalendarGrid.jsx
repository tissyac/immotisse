import { useState, useEffect } from 'react';

function CalendarGrid({ reservedPeriods = [], disabled = false, readOnly = false, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [tempStart, setTempStart] = useState(null);
  const [tempEnd, setTempEnd] = useState(null);

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

  const handleDateClick = (day) => {
    if (readOnly || disabled || !onDateSelect) return;

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
      return;
    }

    if (tempStart && !tempEnd) {
      const start = new Date(tempStart);
      const end = new Date(dateStr);
      const finalStart = start <= end ? tempStart : dateStr;
      const finalEnd = start <= end ? dateStr : tempStart;

      onDateSelect(finalStart, finalEnd);
      setTempStart(null);
      setTempEnd(null);
    }
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
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = date.toDateString() === today.toDateString();
      const reserved = isDateReserved(dateStr);
      const selected = tempStart && tempEnd && dateStr >= tempStart && dateStr <= tempEnd;
      const selectingStart = tempStart && !tempEnd && dateStr === tempStart;

      let className = 'calendar-day';
      if (isToday) className += ' today';
      className += reserved ? ' reserved' : ' available';
      if (selected) className += ' selected';
      if (selectingStart) className += ' selecting';

      days.push(
        <div
          key={day}
          className={className}
          onClick={() => handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    setTempStart(null);
    setTempEnd(null);
  }, [currentMonth, currentYear]);

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
      </div>
    </div>
  );
}

export default CalendarGrid;