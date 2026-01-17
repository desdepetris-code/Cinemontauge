import React, { useState, useMemo } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  mode: 'full' | 'month-year';
}

const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({ isOpen, onClose, currentDate, onDateChange, mode }) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [view, setView] = useState<'days' | 'months' | 'years'>(mode === 'full' ? 'days' : 'months');
  
  if (!isOpen) return null;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    if (mode === 'month-year') {
        onDateChange(newDate);
        onClose();
    } else {
        setView('days');
    }
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setView('months');
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    onDateChange(newDate);
    onClose();
  };

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Fill previous month days (padding)
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Fill current month days
    while (date.getMonth() === month) {
      days.push(date.getDate());
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(viewDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const years = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 120 }, (_, i) => currentYear + 10 - i);
  }, []);

  const renderDaysView = () => (
    <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => setView('months')} className="text-sm font-black uppercase tracking-widest text-text-primary hover:text-primary-accent transition-colors">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </button>
            <div className="flex gap-1">
                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-bg-secondary rounded-full transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-bg-secondary rounded-full transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(d => <div key={d} className="text-center text-[10px] font-black text-text-secondary opacity-40 uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                const isSelected = currentDate.getDate() === day && 
                                  currentDate.getMonth() === viewDate.getMonth() && 
                                  currentDate.getFullYear() === viewDate.getFullYear();
                return (
                    <button
                        key={day}
                        onClick={() => handleDaySelect(day)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-accent-gradient text-on-accent shadow-lg scale-110' : 'hover:bg-bg-secondary text-text-primary'}`}
                    >
                        {day}
                    </button>
                );
            })}
        </div>
    </div>
  );

  const renderMonthsView = () => (
    <div className="animate-fade-in">
        <div className="text-center mb-4">
            <button onClick={() => setView('years')} className="text-sm font-black uppercase tracking-widest text-text-primary hover:text-primary-accent transition-colors">
                {viewDate.getFullYear()}
            </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
                <button 
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={`py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewDate.getMonth() === index ? 'bg-accent-gradient text-on-accent shadow-md' : 'bg-bg-secondary/40 text-text-primary hover:bg-bg-secondary'}`}
                >
                    {month.substring(0, 3)}
                </button>
            ))}
        </div>
    </div>
  );

  const renderYearsView = () => (
    <div className="animate-fade-in">
        <div className="text-center mb-4 font-black uppercase text-[10px] tracking-widest text-text-secondary opacity-60">Select Year</div>
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {years.map(year => (
                <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`py-3 text-xs font-black rounded-xl transition-all ${viewDate.getFullYear() === year ? 'bg-accent-gradient text-on-accent shadow-md' : 'bg-bg-secondary/40 text-text-primary hover:bg-bg-secondary'}`}
                >
                    {year}
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-[320px] p-6 border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-accent">Picker</span>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {view === 'days' && renderDaysView()}
            {view === 'months' && renderMonthsView()}
            {view === 'years' && renderYearsView()}

            {view !== 'days' && mode === 'full' && (
                <button 
                    onClick={() => setView('days')}
                    className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary transition-colors text-center"
                >
                    Back to Days
                </button>
            )}
        </div>
    </div>
  );
};

export default CalendarPickerModal;