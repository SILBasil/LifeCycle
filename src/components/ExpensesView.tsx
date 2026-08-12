import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, Plus, Trash2, Loader2 } from 'lucide-react';

interface ExpensesViewProps {
  userId: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<any | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Budget form states
  const [incomeInput, setIncomeInput] = useState('0');
  const [limitInput, setLimitInput] = useState('0');
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // New Expense item states
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('bill');
  const [newDueDay, setNewDueDay] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  const fetchMonthlyFinance = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Budget for Selected Month
      const { data: budgetData, error: budgetErr } = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', selectedMonth)
        .maybeSingle();

      if (budgetErr) throw budgetErr;

      if (budgetData) {
        setBudget(budgetData);
        setIncomeInput(String(budgetData.monthly_income));
        setLimitInput(String(budgetData.budget_limit));
        setIsEditingBudget(false);
      } else {
        setBudget(null);
        setIncomeInput('0');
        setLimitInput('0');
        setIsEditingBudget(true); // Edit mode to initialize
      }

      // 2. Fetch Expenses for Selected Month
      const { data: expensesData, error: expensesErr } = await supabase
        .from('monthly_expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', selectedMonth)
        .order('due_day', { ascending: true, nullsFirst: false });

      if (expensesErr) throw expensesErr;
      setExpenses(expensesData || []);

    } catch (err) {
      console.error('Error fetching monthly finance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyFinance();
  }, [selectedMonth, userId]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBudget(true);
      const payload = {
        user_id: userId,
        month_year: selectedMonth,
        monthly_income: Number(incomeInput) || 0,
        budget_limit: Number(limitInput) || 0,
      };

      let error;
      if (budget) {
        // Update
        const { error: err } = await supabase
          .from('monthly_budgets')
          .update(payload)
          .eq('id', budget.id)
          .eq('user_id', userId);
        error = err;
      } else {
        // Insert new
        const { error: err } = await supabase
          .from('monthly_budgets')
          .insert(payload);
        error = err;
      }

      if (error) throw error;
      fetchMonthlyFinance();
    } catch (err) {
      console.error('Error saving budget:', err);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    try {
      setSavingItem(true);
      const { error } = await supabase.from('monthly_expenses').insert({
        user_id: userId,
        month_year: selectedMonth,
        title: newTitle.trim(),
        amount: Number(newAmount) || 0,
        category: newCategory,
        due_day: newDueDay ? Math.min(Math.max(Number(newDueDay), 1), 31) : null,
        is_paid: false
      });

      if (error) throw error;

      setNewTitle('');
      setNewAmount('');
      setNewCategory('bill');
      setNewDueDay('');
      setShowAddExpense(false);
      fetchMonthlyFinance();
    } catch (err) {
      console.error('Error adding expense:', err);
    } finally {
      setSavingItem(false);
    }
  };

  const handleTogglePaid = async (id: string, currentPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .update({ is_paid: !currentPaid })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setExpenses(expenses.map(item => item.id === id ? { ...item, is_paid: !currentPaid } : item));
    } catch (err) {
      console.error('Error updating paid status:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('คุณต้องการลบรายการค่าใช้จ่ายนี้ใช่หรือไม่?')) return;
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      fetchMonthlyFinance();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  // Calculations
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalPaid = expenses.filter(item => item.is_paid).reduce((sum, item) => sum + Number(item.amount), 0);
  const totalUnpaid = totalSpent - totalPaid;

  const budgetPercentage = budget && budget.budget_limit > 0 
    ? Math.min((totalSpent / Number(budget.budget_limit)) * 100, 100) 
    : 0;

  const remainingIncome = budget ? Number(budget.monthly_income) - totalSpent : 0;

  // Filter bills & subscriptions
  const bills = expenses.filter(item => item.category === 'bill');
  const subs = expenses.filter(item => item.category === 'subscription');
  const fixed = expenses.filter(item => item.category === 'fixed');
  const others = expenses.filter(item => item.category === 'other');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Month Selector */}
      <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-sm font-bold text-red-500 font-hand border-b border-dashed border-red-300 pb-0.5">
            📊 ประจำรอบเดือน
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold font-hand mt-2">
            สรุปและวางแผนงบการเงิน
          </h2>
        </div>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 bg-control sketch-border-sm text-sm font-extrabold font-hand focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      ) : (
        <>
          {/* Budget Setting Card */}
          <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 text-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-neutral-300">
              <h3 className="text-xl font-extrabold font-hand flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                งบประมาณรายเดือน
              </h3>
              {!isEditingBudget && (
                <button
                  onClick={() => setIsEditingBudget(true)}
                  className="text-xs font-bold underline hover:text-neutral-600 font-hand"
                >
                  แก้ไขงบประมาณ
                </button>
              )}
            </div>

            {isEditingBudget ? (
              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">รายรับหลักประจำเดือนนี้ (บาท):</label>
                    <input
                      type="number"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="เช่น 30000"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">จำกัดเป้างบค่าใช้จ่ายเดือนนี้ (บาท):</label>
                    <input
                      type="number"
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      placeholder="เช่น 15000"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {budget && (
                    <button
                      type="button"
                      onClick={() => {
                        setIncomeInput(String(budget.monthly_income));
                        setLimitInput(String(budget.budget_limit));
                        setIsEditingBudget(false);
                      }}
                      className="px-4 py-1.5 border border-dashed border-neutral-400 text-xs font-bold rounded font-hand"
                    >
                      ยกเลิก
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingBudget}
                    className="sketch-button bg-pencil text-white text-xs rounded shadow-sketch"
                  >
                    {savingBudget ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-3 bg-control/50 sketch-border-sm">
                    <span className="text-xs text-pencil-muted font-hand">รายรับหลักประจำเดือน</span>
                    <p className="text-2xl font-bold font-hand text-emerald-600 mt-1">
                      +{Number(budget?.monthly_income).toLocaleString()} บาท
                    </p>
                  </div>
                  <div className="p-3 bg-control/50 sketch-border-sm">
                    <span className="text-xs text-pencil-muted font-hand">ขีดจำกัดค่าใช้จ่ายที่ตั้งเป้าไว้</span>
                    <p className="text-2xl font-bold font-hand text-neutral-800 mt-1">
                      {Number(budget?.budget_limit).toLocaleString()} บาท
                    </p>
                  </div>
                  <div className="p-3 bg-control/50 sketch-border-sm">
                    <span className="text-xs text-pencil-muted font-hand">ส่วนต่างรายรับหลังหักรายจ่ายทั้งหมด</span>
                    <p className={`text-2xl font-bold font-hand mt-1 ${remainingIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {remainingIncome.toLocaleString()} บาท
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-sm font-hand">
                    <span>ยอดจ่ายจริงปัจจุบัน / เป้างบประมาณที่ตั้งไว้ ({totalSpent.toLocaleString()} / {Number(budget?.budget_limit).toLocaleString()} บาท)</span>
                    <span className="font-bold">{budgetPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-6 bg-neutral-100/50 sketch-border-sm overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-sm sketch-border-sm transition-all duration-300 ${
                        budgetPercentage > 90 ? 'bg-red-400' : budgetPercentage > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${budgetPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-paper p-4 sketch-border shadow-sketch text-left transform -rotate-0.5">
              <span className="text-xs text-pencil-muted font-hand">💸 ยอดรายจ่ายทั้งหมด</span>
              <p className="text-xl font-extrabold font-hand mt-1">{totalSpent.toLocaleString()} บาท</p>
            </div>
            <div className="bg-paper p-4 sketch-border shadow-sketch text-left transform rotate-0.5">
              <span className="text-xs text-pencil-muted font-hand">✓ ชำระแล้วแล้ว</span>
              <p className="text-xl font-extrabold font-hand text-emerald-600 mt-1">{totalPaid.toLocaleString()} บาท</p>
            </div>
            <div className="bg-paper p-4 sketch-border shadow-sketch text-left transform -rotate-0.5">
              <span className="text-xs text-pencil-muted font-hand">⏳ ยังไม่ได้ชำระ</span>
              <p className="text-xl font-extrabold font-hand text-red-600 mt-1">{totalUnpaid.toLocaleString()} บาท</p>
            </div>
            <div className="bg-paper p-4 sketch-border shadow-sketch text-left transform rotate-0.5">
              <span className="text-xs text-pencil-muted font-hand">🏷️ จำนวนรายการ</span>
              <p className="text-xl font-extrabold font-hand text-blue-600 mt-1">{expenses.length} รายการ</p>
            </div>
          </div>

          {/* Expense Adding & Categories Lists */}
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-neutral-300">
              <h3 className="text-xl font-extrabold font-hand">✏️ รายละเอียดการจ่ายเงินรายเดือน</h3>
              {!showAddExpense && (
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="sketch-button bg-amber-50 text-pencil text-xs rounded sketch-border-sm shadow-sketch-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-hand">เพิ่มรายการจ่ายเงิน</span>
                </button>
              )}
            </div>

            {showAddExpense && (
              <div className="bg-paper p-6 sketch-border shadow-sketch text-left transform -rotate-0.5">
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <h4 className="font-bold text-sm font-hand border-b border-dashed border-pencil pb-0.5 inline-block">✏️ จดรายการใหม่</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 font-hand">ชื่อรายการ:</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="เช่น Netflix, ค่าเน็ตมือถือ, ค่าผ่อนบ้าน"
                        className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 font-hand">จำนวนเงิน (บาท):</label>
                      <input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        placeholder="เช่น 350"
                        className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 font-hand">ประเภทค่าใช้จ่าย:</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      >
                        <option value="bill">🔌 บิล / รายจ่ายประจำเดือน (Bills)</option>
                        <option value="subscription">📱 บริการรายเดือน (Subscriptions)</option>
                        <option value="fixed">🏠 รายจ่ายคงที่ / หนี้ / ประกัน (Fixed)</option>
                        <option value="other">🏷️ รายจ่ายทั่วไปอื่นๆ (Other)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 font-hand">วันที่ครบกำหนดในแต่ละเดือน (วันที่ 1-31, ถ้ามี):</label>
                      <input
                        type="number"
                        value={newDueDay}
                        onChange={(e) => setNewDueDay(e.target.value)}
                        placeholder="เช่น 15"
                        min="1"
                        max="31"
                        className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-1.5 border border-dashed border-neutral-400 text-xs font-bold rounded font-hand"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={savingItem}
                      className="sketch-button bg-pencil text-white text-xs rounded shadow-sketch"
                    >
                      {savingItem ? 'กำลังจด...' : 'จดบันทึกรายจ่าย'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List rendered by category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bills Checklist */}
              <div className="bg-paper p-6 sketch-border shadow-sketch text-left transform rotate-0.5">
                <h4 className="text-lg font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 mb-4 text-sky-600">
                  🔌 บิลหลัก (Bills - {bills.length} รายการ)
                </h4>
                {bills.length === 0 ? (
                  <p className="text-sm text-pencil-muted font-hand text-center py-4">ไม่มีบิลประจำเดือนนี้</p>
                ) : (
                  <div className="space-y-3">
                    {bills.map(item => (
                      <ExpenseItem key={item.id} item={item} onToggle={handleTogglePaid} onDelete={handleDeleteExpense} />
                    ))}
                  </div>
                )}
              </div>

              {/* Subscriptions Checklist */}
              <div className="bg-paper p-6 sketch-border shadow-sketch text-left transform -rotate-0.5">
                <h4 className="text-lg font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 mb-4 text-indigo-600">
                  📱 บริการรายเดือน (Subscriptions - {subs.length} รายการ)
                </h4>
                {subs.length === 0 ? (
                  <p className="text-sm text-pencil-muted font-hand text-center py-4">ไม่มีบริการรายเดือน</p>
                ) : (
                  <div className="space-y-3">
                    {subs.map(item => (
                      <ExpenseItem key={item.id} item={item} onToggle={handleTogglePaid} onDelete={handleDeleteExpense} />
                    ))}
                  </div>
                )}
              </div>

              {/* Fixed Expenses Checklist */}
              <div className="bg-paper p-6 sketch-border shadow-sketch text-left transform -rotate-0.5">
                <h4 className="text-lg font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 mb-4 text-emerald-600">
                  🏠 รายจ่ายคงที่/หนี้สิน/ประกัน ({fixed.length} รายการ)
                </h4>
                {fixed.length === 0 ? (
                  <p className="text-sm text-pencil-muted font-hand text-center py-4">ไม่มีรายจ่ายคงที่</p>
                ) : (
                  <div className="space-y-3">
                    {fixed.map(item => (
                      <ExpenseItem key={item.id} item={item} onToggle={handleTogglePaid} onDelete={handleDeleteExpense} />
                    ))}
                  </div>
                )}
              </div>

              {/* Other Expenses */}
              <div className="bg-paper p-6 sketch-border shadow-sketch text-left transform rotate-0.5">
                <h4 className="text-lg font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 mb-4 text-neutral-600">
                  🏷️ รายจ่ายทั่วไปอื่นๆ ({others.length} รายการ)
                </h4>
                {others.length === 0 ? (
                  <p className="text-sm text-pencil-muted font-hand text-center py-4">ไม่มีรายการอื่นๆ</p>
                ) : (
                  <div className="space-y-3">
                    {others.map(item => (
                      <ExpenseItem key={item.id} item={item} onToggle={handleTogglePaid} onDelete={handleDeleteExpense} />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Subcomponent for Expense Item
interface ExpenseItemProps {
  item: any;
  onToggle: (id: string, currentPaid: boolean) => void;
  onDelete: (id: string) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ item, onToggle, onDelete }) => {
  return (
    <div className={`p-3 bg-control/30 hover:bg-control sketch-border-sm flex items-center justify-between transition-all ${item.is_paid ? 'opacity-60 bg-stone-100/10' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(item.id, item.is_paid)}
          className={`w-5 h-5 rounded-md border-2 border-pencil flex-shrink-0 flex items-center justify-center font-extrabold text-xs font-hand ${
            item.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-transparent'
          }`}
        >
          {item.is_paid ? '✓' : ''}
        </button>
        <div>
          <span className={`font-bold font-hand text-sm block ${item.is_paid ? 'line-through text-pencil-muted' : ''}`}>
            {item.title}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold font-hand text-pencil-muted`}>
              💸 {Number(item.amount).toLocaleString()} บาท
            </span>
            {item.due_day && (
              <span className="text-[10px] font-bold text-red-500 font-hand bg-red-50 px-1.5 rounded sketch-border-sm">
                จ่ายก่อนวันที่ {item.due_day}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded sketch-border-sm border-transparent transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
