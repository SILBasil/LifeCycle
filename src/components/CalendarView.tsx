import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Clock, Loader2, X } from 'lucide-react';

interface CalendarViewProps {
  userId: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMonthEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Get first day and last day of the month in ISO string format
      const startOfMonth = new Date(year, month, 1, 0, 0, 0).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('end_time', startOfMonth)
        .lte('start_time', endOfMonth)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthEvents();
  }, [currentDate, userId]);

  // Calendar generation helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayIndex = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayEvents = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter(event => {
      const eventStartStr = new Date(event.start_time).toLocaleDateString('sv-SE'); // YYYY-MM-DD format
      const eventEndStr = new Date(event.end_time).toLocaleDateString('sv-SE');
      return targetDateStr >= eventStartStr && targetDateStr <= eventEndStr;
    });
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setShowAddForm(false);
    
    // Set default times for the new event form (today + 1 hour duration)
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, '0');
    const d = String(selected.getDate()).padStart(2, '0');
    
    setNewStart(`${year}-${month}-${d}T10:00`);
    setNewEnd(`${year}-${month}-${d}T11:00`);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('events').insert({
        user_id: userId,
        title: newTitle,
        description: newDesc,
        start_time: new Date(newStart).toISOString(),
        end_time: new Date(newEnd).toISOString(),
        is_all_day: false
      });

      if (error) throw error;

      setNewTitle('');
      setNewDesc('');
      setShowAddForm(false);
      fetchMonthEvents();
    } catch (err) {
      console.error('Error adding event:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?')) return;
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMonthEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty slots for previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isSelected = selectedDate.getDate() === day && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear();
                         
      const isToday = new Date().getDate() === day &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <button
          key={`day-${day}`}
          onClick={() => handleSelectDay(day)}
          className={`p-1 md:p-2 min-h-11 md:min-h-16 flex flex-col justify-between hover:bg-neutral-50/20 transition-colors relative text-left border border-neutral-200 rounded-md ${
            isSelected ? 'sketch-border bg-amber-50/50' : 'bg-transparent'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <span className={`text-sm font-bold font-hand ${isToday ? 'highlight-scribble font-extrabold text-red-500' : ''}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-pencil shadow-sm"></span>
            )}
          </div>
          {dayEvents.length > 0 && (
            <span className="text-[10px] truncate max-w-full text-pencil-muted font-hand hidden md:block mt-1">
              ✏️ {dayEvents.length} กิจกรรม
            </span>
          )}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const selectedDateEvents = events.filter(event => {
    const eventStartStr = new Date(event.start_time).toLocaleDateString('sv-SE');
    const eventEndStr = new Date(event.end_time).toLocaleDateString('sv-SE');
    const selectedDateStr = selectedDate.toLocaleDateString('sv-SE');
    return selectedDateStr >= eventStartStr && selectedDateStr <= eventEndStr;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-extrabold font-hand flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-500" />
            ตารางนัดหมาย & ปฏิทิน
          </h2>
          <div className="flex items-center gap-2 sketch-border-sm bg-control p-1">
            <button onClick={prevMonth} className="p-1 hover:bg-control/60 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg px-2 font-hand min-w-32 text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-neutral-200 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of the Week Header */}
        <div className="grid grid-cols-7 gap-2 mt-6 text-center text-xs font-extrabold font-hand text-pencil-muted border-b border-dashed border-neutral-300 pb-2">
          <div className="text-red-500">อา.</div>
          <div>จ.</div>
          <div>อ.</div>
          <div>พ.</div>
          <div>พฤ.</div>
          <div>ศ.</div>
          <div className="text-blue-500">ส.</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 mt-2">
            {renderCalendarDays()}
          </div>
        )}
      </div>

      {/* Selected Day Events & Management */}
      <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-dashed border-neutral-300">
          <h3 className="text-xl font-extrabold font-hand text-left">
            📅 กิจกรรมสำหรับวันที่ {selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="sketch-button bg-sky-50 text-sky-800 text-xs rounded sketch-border-sm shadow-sketch-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="font-hand">จดนัดหมายใหม่</span>
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleAddEvent} className="bg-control/50 p-4 sketch-border-sm mb-6 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm font-hand border-b border-dashed border-pencil pb-0.5">✏️ กรอกรายละเอียดนัดหมาย</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="p-1 hover:bg-neutral-200 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 font-hand">หัวข้อกิจกรรม / นัดหมาย:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น นัดทานข้าวกับหมอ, ส่งงานโปรเจกต์"
                className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 font-hand">รายละเอียดเพิ่มเติม (ถ้ามี):</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="ระบุสถานที่ รายละเอียด หรือหัวข้อสำคัญ"
                className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 font-hand">เวลาเริ่ม:</label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 font-hand">เวลาสิ้นสุด:</label>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded p-2 shadow-sketch"
            >
              {saving ? <span className="font-hand">กำลังบันทึก...</span> : <span className="font-hand">บันทึกนัดหมายลงสมุด</span>}
            </button>
          </form>
        )}

        {selectedDateEvents.length === 0 ? (
          <p className="py-8 text-center text-pencil-muted font-hand">ไม่มีบันทึกกิจกรรมสำหรับวันนี้ ☕</p>
        ) : (
          <div className="space-y-4">
            {selectedDateEvents.map((event) => {
              const startTime = new Date(event.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              const endTime = new Date(event.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={event.id} className="p-4 bg-control/50 sketch-border-sm flex justify-between items-start hover:bg-control transition-all text-left">
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg font-hand">{event.title}</h4>
                    <p className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      เวลา {startTime} ถึง {endTime} น.
                    </p>
                    {event.description && (
                      <p className="text-sm font-hand text-pencil mt-2 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded sketch-border-sm border-transparent transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
