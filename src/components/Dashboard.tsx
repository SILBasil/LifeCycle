import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, CheckSquare, DollarSign, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface DashboardProps {
  userId: string;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userId, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [budget, setBudget] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getTodayDateString = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('th-TH', options);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const currentMonthYear = `${year}-${month}`;

      // 1. Fetch Today's Events
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .or(`and(start_time.gte.${todayStart},start_time.lte.${todayEnd}),and(end_time.gte.${todayStart},end_time.lte.${todayEnd}),and(start_time.lte.${todayStart},end_time.gte.${todayEnd})`)
        .order('start_time', { ascending: true });

      if (eventsErr) throw eventsErr;
      setEvents(eventsData || []);

      // 2. Fetch Tasks (Uncompleted & High Priority)
      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'done')
        .order('priority', { ascending: false })
        .limit(5);

      if (tasksErr) throw tasksErr;
      setTasks(tasksData || []);

      // 3. Fetch Monthly Budget
      const { data: budgetData, error: budgetErr } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (budgetErr) throw budgetErr;
      setBudget(budgetData);

      // 4. Fetch Monthly Expenses
      const { data: expensesData, error: expensesErr } = await supabase
        .from('monthly_expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', currentMonthYear);

      if (expensesErr) throw expensesErr;
      setExpenses(expensesData || []);

    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const income = budget ? Number(budget.monthly_income) : 0;
  const budgetLimit = budget ? Number(budget.budget_limit) : 0;
  const remainingBudget = budgetLimit - totalExpenses;
  const budgetPercentage = budgetLimit > 0 ? Math.min((totalExpenses / budgetLimit) * 100, 100) : 0;

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'todo' ? 'doing' : currentStatus === 'doing' ? 'done' : 'todo';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t).filter(t => t.status !== 'done'));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-600 mb-3" />
        <p className="font-hand text-lg text-pencil-muted">กำลังเปิดอ่านสมุดบันทึก...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section - plain text on mobile, notebook card on desktop */}
      <div className="p-2 md:p-6 bg-transparent md:bg-paper md:sketch-border md:shadow-sketch md:transform md:-rotate-0.5 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs md:text-sm font-bold text-red-500 font-hand border-b border-dashed border-red-300 pb-0.5">
              ✏️ หน้าบันทึกของวันนี้
            </span>
            <h2 className="text-lg md:text-2xl font-extrabold font-hand mt-2 flex items-center gap-2">
              {getTodayDateString()}
            </h2>
          </div>
          <button
            onClick={fetchDashboardData}
            className="sketch-button bg-amber-50 text-pencil text-xs md:text-sm rounded-md sketch-border-sm shadow-sketch-sm mt-2 md:mt-0"
          >
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
            <span className="font-hand">ซิงค์บันทึก</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 sketch-border-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="font-hand text-sm">{error}</p>
        </div>
      )}

      {/* Grid container for dashboard items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Today's Schedule Card */}
        <div className="bg-paper p-6 sketch-border shadow-sketch flex flex-col justify-between transform rotate-0.5">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-neutral-300">
              <h3 className="text-sm md:text-lg font-extrabold font-hand flex items-center gap-2">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-sky-500" />
                ตารางนัดหมายวันนี้
              </h3>
              <span className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-hand">
                {events.length} รายการ
              </span>
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center text-pencil-muted font-hand">
                <p>ไม่มีนัดหมายสำหรับวันนี้พักผ่อนได้! ☕</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {events.map((event) => {
                  const startTime = new Date(event.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  const endTime = new Date(event.end_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={event.id} className="p-3 bg-control/50 sketch-border-sm flex flex-col gap-1 hover:bg-control transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-base font-hand text-left">{event.title}</h4>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 sketch-border-sm flex-shrink-0 font-hand">
                          {startTime} - {endTime}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-pencil-muted font-hand text-left mt-1">{event.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('Calendar')}
            className="w-full mt-4 py-1.5 text-center text-sm font-bold border-t border-dashed border-neutral-300 hover:text-sky-600 font-hand pt-3"
          >
            เปิดหน้าปฏิทินแบบละเอียด →
          </button>
        </div>

        {/* Today's Tasks Card */}
        <div className="bg-paper p-6 sketch-border shadow-sketch flex flex-col justify-between transform -rotate-0.5">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-neutral-300">
              <h3 className="text-sm md:text-lg font-extrabold font-hand flex items-center gap-2">
                <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                งานสำคัญที่ต้องจัดการ
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-hand">
                {tasks.length} งาน
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center text-pencil-muted font-hand">
                <p>งานด่วนเคลียร์หมดแล้ว! ยอดเยี่ยมมาก 🎉</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2 bg-control/50 hover:bg-control sketch-border-sm transition-colors">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className={`w-5 h-5 rounded border-2 border-pencil flex-shrink-0 flex items-center justify-center font-bold text-xs font-hand ${task.status === 'doing' ? 'bg-amber-100 text-amber-800' : 'bg-transparent'}`}
                    >
                      {task.status === 'doing' ? '/' : ''}
                    </button>
                    <div className="flex-grow text-left">
                      <span className="font-hand text-sm font-bold block">{task.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 rounded sketch-border-sm font-hand ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {task.priority === 'high' ? 'ด่วน' : task.priority === 'medium' ? 'ปกติ' : 'ต่ำ'}
                        </span>
                        {task.project_name && (
                          <span className="text-[10px] text-pencil-muted font-hand bg-neutral-100 px-1 rounded">
                            📂 {task.project_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate('Tasks')}
            className="w-full mt-4 py-1.5 text-center text-sm font-bold border-t border-dashed border-neutral-300 hover:text-emerald-600 font-hand pt-3"
          >
            จัดการงานทั้งหมดที่ค้างอยู่ →
          </button>
        </div>

      </div>

      {/* Monthly Finance Summary Card */}
      <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5">
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-dashed border-neutral-300">
          <h3 className="text-xl font-extrabold font-hand flex items-center gap-2">
            <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            การเงินประจำเดือนนี้
          </h3>
          <button
            onClick={() => onNavigate('Expenses')}
            className="text-xs font-bold underline hover:text-amber-600 font-hand"
          >
            ไปหน้าวางแผนการเงิน →
          </button>
        </div>

        {!budget ? (
          <div className="py-8 text-center text-pencil-muted font-hand">
            <p>ยังไม่ได้วางแผนการเงินในรอบเดือนนี้ 📊</p>
            <button
              onClick={() => onNavigate('Expenses')}
              className="mt-3 sketch-button bg-amber-50 text-sm rounded sketch-border-sm shadow-sketch-sm"
            >
              เริ่มต้นตั้งงบประมาณ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-control/50 sketch-border-sm">
                <span className="text-xs text-pencil-muted font-hand">รายรับหลักประจำเดือนนี้</span>
                <p className="text-2xl font-bold font-hand text-emerald-600 mt-1">+{income.toLocaleString()} บาท</p>
              </div>
              <div className="p-3 bg-control/50 sketch-border-sm">
                <span className="text-xs text-pencil-muted font-hand">จ่ายไปแล้วทั้งหมด</span>
                <p className="text-2xl font-bold font-hand text-rose-600 mt-1">-{totalExpenses.toLocaleString()} บาท</p>
              </div>
              <div className="p-3 bg-control/50 sketch-border-sm">
                <span className="text-xs text-pencil-muted font-hand">งบจำกัด / ส่วนต่างเหลือ</span>
                <p className={`text-2xl font-bold font-hand mt-1 ${remainingBudget >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {remainingBudget.toLocaleString()} บาท
                </p>
              </div>
            </div>

            {/* Custom hand-drawn progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1 text-sm font-hand">
                <span>ความคืบหน้าการใช้งบตามเป้า ({totalExpenses.toLocaleString()} / {budgetLimit.toLocaleString()} บาท)</span>
                <span className="font-bold">{budgetPercentage.toFixed(0)}%</span>
              </div>

              {/* Hand-drawn look container */}
              <div className="w-full h-8 sketch-border-sm bg-neutral-100/50 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-sm sketch-border-sm transition-all duration-500 ease-out ${budgetPercentage > 90 ? 'bg-red-400' : budgetPercentage > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  style={{ width: `${budgetPercentage}%` }}
                >
                  {/* Subtle scribble inside progress */}
                  <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[size:10px_10px]"></div>
                </div>
              </div>
              {budgetPercentage > 90 && (
                <p className="text-xs text-red-500 font-hand mt-2 text-left">
                  ⚠️ ระวัง! คุณใช้จ่ายเกิน 90% ของงบประมาณรายเดือนที่จำกัดไว้แล้ว
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
