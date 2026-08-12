import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ListTodo, Plus, Trash2, Calendar, Folder, Loader2, 
  Briefcase, TrendingUp, DollarSign, Link as LinkIcon, 
  MessageSquare, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';

interface TasksViewProps {
  userId: string;
}

export const TasksView: React.FC<TasksViewProps> = ({ userId }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'daily' | 'freelance'>('daily');

  // ==========================================
  // 📌 DAILY TASKS STATES & METHODS
  // ==========================================
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [projects, setProjects] = useState<string[]>([]);
  
  // New Task form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProject, setNewProject] = useState('General');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);

      const uniqueProjects = Array.from(
        new Set((data || []).map((t: any) => t.project_name || 'General'))
      ) as string[];
      setProjects(uniqueProjects);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: newTitle,
        description: newDesc,
        project_name: newProject.trim() || 'General',
        priority: newPriority,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        status: 'todo'
      });

      if (error) throw error;

      setNewTitle('');
      setNewDesc('');
      setNewProject('General');
      setNewPriority('medium');
      setNewDueDate('');
      setShowAddForm(false);
      fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'todo' ? 'doing' : currentStatus === 'doing' ? 'done' : 'todo';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: nextStatus })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // ==========================================
  // 💼 FREELANCE JOBS STATES & METHODS
  // ==========================================
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsSaving, setJobsSaving] = useState(false);
  const [showAddJobForm, setShowAddJobForm] = useState(false);

  // Filters for jobs
  const [filterJobType, setFilterJobType] = useState<string>('all'); // all, main, freelance
  const [filterJobStatus, setFilterJobStatus] = useState<string>('all'); // all, pending, in_progress, completed

  // Job Form states
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState<'main' | 'freelance'>('freelance');
  const [jobCategory, setJobCategory] = useState<'fastwork_smm' | 'other_freelance'>('fastwork_smm');
  const [clientName, setClientName] = useState('');
  const [clientChatUrl, setClientChatUrl] = useState('');
  const [price, setPrice] = useState('0');
  const [cost, setCost] = useState('0');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // SMM specific details states
  const [smmLink, setSmmLink] = useState('');
  const [smmPlatform, setSmmPlatform] = useState('ig : ฟอล');
  const [smmServiceType, setSmmServiceType] = useState('ไทย');
  const [smmStartCount, setSmmStartCount] = useState('0');
  const [smmTargetCount, setSmmTargetCount] = useState('0');
  const [smmForeignAdded, setSmmForeignAdded] = useState('0');
  const [smmForeignGift, setSmmForeignGift] = useState('0');
  const [smmForeignDone, setSmmForeignDone] = useState('0');
  const [smmThaiAdded, setSmmThaiAdded] = useState('0');
  const [smmThaiGift, setSmmThaiGift] = useState('0');
  const [smmThaiDone, setSmmThaiDone] = useState('0');
  const [smmUrl, setSmmUrl] = useState('');
  const [jobNotes, setJobNotes] = useState('');

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const { data, error } = await supabase
        .from('freelance_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Handle table not created yet error gracefully
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, empty state is fine
          setJobs([]);
          return;
        }
        throw error;
      }
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching freelance jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    try {
      setJobsSaving(true);
      
      const details: any = {
        notes: jobNotes
      };
      
      if (jobCategory === 'fastwork_smm') {
        details.link = smmLink;
        details.platform_service = smmPlatform;
        details.service_type = smmServiceType;
        details.start_count = Number(smmStartCount) || 0;
        details.target_count = Number(smmTargetCount) || 0;
        details.foreign_added = Number(smmForeignAdded) || 0;
        details.foreign_gift = Number(smmForeignGift) || 0;
        details.foreign_done = Number(smmForeignDone) || 0;
        details.thai_added = Number(smmThaiAdded) || 0;
        details.thai_gift = Number(smmThaiGift) || 0;
        details.thai_done = Number(smmThaiDone) || 0;
        details.smm_url = smmUrl;
      }

      const { error } = await supabase.from('freelance_jobs').insert({
        user_id: userId,
        title: jobTitle,
        job_type: jobType,
        category: jobCategory,
        client_name: clientName,
        client_chat_url: clientChatUrl,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || null,
        status: 'pending',
        details
      });

      if (error) throw error;

      // Reset Job Form
      setJobTitle('');
      setClientName('');
      setClientChatUrl('');
      setPrice('0');
      setCost('0');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setSmmLink('');
      setSmmPlatform('ig : ฟอล');
      setSmmServiceType('ไทย');
      setSmmStartCount('0');
      setSmmTargetCount('0');
      setSmmForeignAdded('0');
      setSmmForeignGift('0');
      setSmmForeignDone('0');
      setSmmThaiAdded('0');
      setSmmThaiGift('0');
      setSmmThaiDone('0');
      setSmmUrl('');
      setJobNotes('');
      setShowAddJobForm(false);
      
      fetchJobs();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกงาน: กรุณาตรวจสอบว่าได้สร้างตารางใน Supabase SQL Editor เรียบร้อยแล้ว');
      console.error('Error adding freelance job:', err);
    } finally {
      setJobsSaving(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('คุณต้องการลบงานนี้ใช่หรือไม่? ข้อมูลทั้งหมดจะถูกลบถาวร')) return;
    try {
      const { error } = await supabase
        .from('freelance_jobs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      fetchJobs();
    } catch (err) {
      console.error('Error deleting freelance job:', err);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    let nextStatus = 'pending';
    let dateFinished: string | null = null;
    
    if (currentStatus === 'pending') {
      nextStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
      dateFinished = new Date().toISOString().split('T')[0];
    } else {
      nextStatus = 'pending';
    }
    
    try {
      const updateData: any = { status: nextStatus };
      updateData.end_date = nextStatus === 'completed' ? dateFinished : null;

      const { error } = await supabase
        .from('freelance_jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setJobs(jobs.map(j => j.id === jobId ? { ...j, ...updateData } : j));
    } catch (err) {
      console.error('Error toggling job status:', err);
    }
  };

  const handleUpdateDoneCount = async (jobId: string, type: 'thai' | 'foreign', value: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const updatedDetails = { ...job.details };
    if (type === 'thai') {
      updatedDetails.thai_done = Math.max(0, (Number(updatedDetails.thai_done) || 0) + value);
    } else {
      updatedDetails.foreign_done = Math.max(0, (Number(updatedDetails.foreign_done) || 0) + value);
    }
    
    try {
      const { error } = await supabase
        .from('freelance_jobs')
        .update({ details: updatedDetails })
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;
      setJobs(jobs.map(j => j.id === jobId ? { ...j, details: updatedDetails } : j));
    } catch (err) {
      console.error('Error updating done count:', err);
    }
  };

  // Calculations helper for SMM metrics
  const getJobSMMCalculations = (job: any) => {
    const details = job.details || {};
    const startCount = Number(details.start_count) || 0;
    
    const foreignAdded = Number(details.foreign_added) || 0;
    const foreignGift = Number(details.foreign_gift) || 0;
    const foreignDone = Number(details.foreign_done) || 0;
    
    const thaiAdded = Number(details.thai_added) || 0;
    const thaiGift = Number(details.thai_gift) || 0;
    const thaiDone = Number(details.thai_done) || 0;
    
    const totalTargetToAdd = foreignAdded + foreignGift + thaiAdded + thaiGift;
    const totalTargetFollowers = startCount + totalTargetToAdd;
    
    const remainingForeign = Math.max(0, (foreignAdded + foreignGift) - foreignDone);
    const remainingThai = Math.max(0, (thaiAdded + thaiGift) - thaiDone);
    
    const totalDone = foreignDone + thaiDone;
    
    const progressPercent = totalTargetToAdd > 0 
      ? Math.min(100, Math.round((totalDone / totalTargetToAdd) * 100))
      : 0;

    let daysSpent = 0;
    if (job.start_date) {
      const start = new Date(job.start_date);
      const end = job.end_date ? new Date(job.end_date) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      daysSpent = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }
    
    const profit = (Number(job.price) || 0) - (Number(job.cost) || 0);

    return {
      totalTargetFollowers,
      totalTargetToAdd,
      remainingForeign,
      remainingThai,
      totalDone,
      progressPercent,
      daysSpent,
      profit
    };
  };

  // Mount logic
  useEffect(() => {
    fetchTasks();
    fetchJobs();
  }, [userId]);

  // ==========================================
  // ⚡ FILTERS & RENDER LOGIC
  // ==========================================
  
  // Tasks filters
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const projectMatch = filterProject === 'all' || (task.project_name || 'General') === filterProject;
    return statusMatch && projectMatch;
  });

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const tasksProgressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Freelance filters
  const filteredJobs = jobs.filter(job => {
    const typeMatch = filterJobType === 'all' || job.job_type === filterJobType;
    const statusMatch = filterJobStatus === 'all' || job.status === filterJobStatus;
    return typeMatch && statusMatch;
  });

  // Freelance stats summary
  const totalRevenue = jobs.reduce((sum, j) => sum + (Number(j.price) || 0), 0);
  const totalExpenses = jobs.reduce((sum, j) => sum + (Number(j.cost) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeJobsCount = jobs.filter(j => j.status !== 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* 📑 Tabs Selector */}
      <div className="flex border-b-2 border-pencil dark:border-pencil-dark pb-0.5 gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 font-hand font-extrabold text-sm md:text-base border-2 transition-all rounded-t-md relative -bottom-[2px] ${
            activeTab === 'daily'
              ? 'bg-paper border-pencil border-b-transparent dark:border-pencil-dark dark:border-b-transparent font-black z-10'
              : 'border-transparent text-pencil-muted hover:text-pencil'
          }`}
        >
          <ListTodo className="w-4 h-4 text-emerald-500" />
          <span>📌 งานประจำวัน (Daily Checklist)</span>
        </button>
        <button
          onClick={() => setActiveTab('freelance')}
          className={`flex items-center gap-2 px-4 py-2 font-hand font-extrabold text-sm md:text-base border-2 transition-all rounded-t-md relative -bottom-[2px] ${
            activeTab === 'freelance'
              ? 'bg-paper border-pencil border-b-transparent dark:border-pencil-dark dark:border-b-transparent font-black z-10'
              : 'border-transparent text-pencil-muted hover:text-pencil'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-500" />
          <span>💼 งานเสริม & ฟรีแลนซ์</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 📌 RENDER DAILY TASKS TAB */}
      {/* ============================================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Title & Stats */}
          <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg md:text-xl font-extrabold font-hand flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-500" />
                เช็คลิสต์งานที่ต้องจัดการประจำวัน
              </h2>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="sketch-button bg-emerald-50 text-emerald-800 text-xs rounded sketch-border-sm shadow-sketch-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-hand">จดงานชิ้นใหม่</span>
                </button>
              )}
            </div>

            {tasks.length > 0 && (
              <div className="mt-4 p-3 bg-control/50 sketch-border-sm">
                <div className="flex justify-between items-center text-xs font-hand mb-1.5">
                  <span>ความคืบหน้า ({completedTasksCount} / {tasks.length} งาน)</span>
                  <span className="font-bold">{tasksProgressPercent}% สำเร็จ</span>
                </div>
                <div className="w-full h-3 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-emerald-400 rounded-sm sketch-border-sm transition-all duration-300"
                    style={{ width: `${tasksProgressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 text-left">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-pencil">
                <h3 className="text-base font-extrabold font-hand">✏️ เขียนใบงานประจำวัน</h3>
                <button onClick={() => setShowAddForm(false)} className="text-xs font-bold underline font-hand">
                  ปิดหน้าต่าง
                </button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 font-hand">หัวข้องาน:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="เช่น เตรียมเอกสารส่งลูกค้า, ทยอยรันฟอลค้าง"
                    className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 font-hand">รายละเอียด:</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="ระบุคำอธิบายงานย่อยลงตรงนี้..."
                    className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">หมวดโปรเจกต์:</label>
                    <input
                      type="text"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="General, Fastwork"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ความเร่งด่วน:</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    >
                      <option value="high">🔴 ด่วน (High)</option>
                      <option value="medium">🟡 ปกติ (Medium)</option>
                      <option value="low">🟢 สบายๆ (Low)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">กำหนดส่ง (Due Date):</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded p-2 shadow-sketch"
                >
                  {saving ? <span className="font-hand">กำลังเซฟ...</span> : <span className="font-hand">จดลงเช็คลิสต์</span>}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-paper sketch-border shadow-sketch transform rotate-0.5">
            <div className="flex items-center gap-1 bg-control p-1 sketch-border-sm">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'todo', label: 'ยังไม่ทำ' },
                { id: 'doing', label: 'กำลังทำ' },
                { id: 'done', label: 'เสร็จแล้ว' }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => setFilterStatus(status.id)}
                  className={`px-3 py-1 text-xs font-bold font-hand rounded transition-colors ${
                    filterStatus === status.id ? 'bg-pencil text-paper' : 'hover:bg-control/50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-hand text-pencil-muted">กรองตามโปรเจกต์:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="p-1 text-xs font-bold font-hand bg-control sketch-border-sm focus:outline-none"
              >
                <option value="all">📁 ทั้งหมด</option>
                {projects.map((proj, i) => (
                  <option key={i} value={proj}>
                    📁 {proj}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks List */}
          {tasksLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-paper p-10 sketch-border shadow-sketch text-center text-pencil-muted font-hand">
              ไม่มีรายการงานที่ตรงกับตัวกรองนี้ ☕
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'done';
                const isDoing = task.status === 'doing';
                return (
                  <div
                    key={task.id}
                    className={`bg-paper p-4 sketch-border shadow-sketch transform hover:translate-x-1 transition-all flex items-start gap-4 text-left ${
                      isDone ? 'opacity-60 bg-control/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggleStatus(task.id, task.status)}
                      className={`w-6 h-6 rounded-md border-2 border-pencil flex-shrink-0 flex items-center justify-center font-extrabold text-sm font-hand transition-all ${
                        isDone ? 'bg-emerald-100 text-emerald-800 line-through' :
                        isDoing ? 'bg-amber-100 text-amber-800' : 'bg-transparent'
                      }`}
                    >
                      {isDone ? '✓' : isDoing ? '/' : ''}
                    </button>

                    <div className="flex-grow space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-base md:text-lg font-hand ${isDone ? 'line-through text-pencil-muted' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full sketch-border-sm font-hand ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {task.priority === 'high' ? 'ด่วน' : task.priority === 'medium' ? 'ปกติ' : 'ต่ำ'}
                        </span>
                        {task.project_name && (
                          <span className="text-[10px] text-pencil-muted font-hand bg-neutral-100 px-2 py-0.5 sketch-border-sm flex items-center gap-1">
                            <Folder className="w-3 h-3 text-neutral-400" />
                            {task.project_name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className={`text-sm text-pencil-muted font-hand leading-relaxed ${isDone ? 'line-through' : ''}`}>
                          {task.description}
                        </p>
                      )}

                      {task.due_date && (
                        <p className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          กำหนดส่ง: {new Date(task.due_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
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
      )}

      {/* ============================================================== */}
      {/* 💼 RENDER FREELANCE JOBS TAB */}
      {/* ============================================================== */}
      {activeTab === 'freelance' && (
        <div className="space-y-6">
          
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-paper p-3 sketch-border shadow-sketch flex flex-col justify-between">
              <span className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> รายรับรวมสะสม
              </span>
              <p className="text-lg md:text-xl font-extrabold font-hand text-emerald-600 mt-1">
                ฿{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-paper p-3 sketch-border shadow-sketch flex flex-col justify-between">
              <span className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> ต้นทุนสะสม
              </span>
              <p className="text-lg md:text-xl font-extrabold font-hand text-rose-600 mt-1">
                ฿{totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="bg-paper p-3 sketch-border shadow-sketch flex flex-col justify-between">
              <span className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> กำไรสุทธิ
              </span>
              <p className="text-lg md:text-xl font-extrabold font-hand text-blue-600 mt-1">
                ฿{netProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-paper p-3 sketch-border shadow-sketch flex flex-col justify-between">
              <span className="text-xs text-pencil-muted font-hand flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> งานค้างส่งมอบ
              </span>
              <p className="text-lg md:text-xl font-extrabold font-hand text-amber-600 mt-1">
                {activeJobsCount} งาน
              </p>
            </div>
          </div>

          {/* Title & Action Box */}
          <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold font-hand flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  จัดการบันทึกรายได้งานเสริมและงานฟาสต์เวิร์ก
                </h2>
                <p className="text-xs text-pencil-muted font-hand mt-1">
                  ติดตามสถานะผู้ติดตาม, ลิงก์แชทของลูกค้า, ต้นทุน และคำนวณกำไรอัตโนมัติ
                </p>
              </div>
              {!showAddJobForm && (
                <button
                  onClick={() => setShowAddJobForm(true)}
                  className="sketch-button bg-amber-50 text-amber-800 text-xs rounded sketch-border-sm shadow-sketch-sm w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-hand">บันทึกงานชิ้นใหม่</span>
                </button>
              )}
            </div>
          </div>

          {/* Add Job Form */}
          {showAddJobForm && (
            <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 text-left">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-pencil">
                <h3 className="text-base font-extrabold font-hand">✏️ บันทึกรายละเอียดงานใหม่</h3>
                <button onClick={() => setShowAddJobForm(false)} className="text-xs font-bold underline font-hand">
                  ปิดหน้าต่าง
                </button>
              </div>
              <form onSubmit={handleAddJob} className="space-y-4">
                
                {/* Job Info row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ชื่องาน / ลูกค้า:</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="เช่น Maymii IG, คุณทอม ตต"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ประเภทงาน:</label>
                    <select
                      value={jobType}
                      onChange={(e: any) => setJobType(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    >
                      <option value="freelance">💼 งานเสริม (Side Job)</option>
                      <option value="main">🏢 งานหลัก (Main Job)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ประเภทหมวดหมู่:</label>
                    <select
                      value={jobCategory}
                      onChange={(e: any) => setJobCategory(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    >
                      <option value="fastwork_smm">🚀 Fastwork / ปั๊มฟอล (SMM)</option>
                      <option value="other_freelance">🎨 งานฟรีแลนซ์ทั่วไป (อื่นๆ)</option>
                    </select>
                  </div>
                </div>

                {/* Client Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ชื่อผู้ว่าจ้าง:</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="เช่น สมชาย, voyade"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ลิงก์แชทคุยงาน:</label>
                    <input
                      type="url"
                      value={clientChatUrl}
                      onChange={(e) => setClientChatUrl(e.target.value)}
                      placeholder="เช่น ลิงก์คุยแชท fastwork"
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                </div>

                {/* SMM Specific Input Form Fields */}
                {jobCategory === 'fastwork_smm' && (
                  <div className="p-4 bg-control/40 sketch-border-sm space-y-4">
                    <h4 className="text-xs font-bold font-hand border-b border-dashed border-pencil pb-1 text-pencil-muted">
                      ⚙️ กรอกรายละเอียดงานปั๊มฟอล/ไลค์ (Fastwork SMM)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ลิงก์โปรไฟล์ / ลิงก์โพสต์ลูกค้า:</label>
                        <input
                          type="url"
                          value={smmLink}
                          onChange={(e) => setSmmLink(e.target.value)}
                          placeholder="ลิงก์ IG, TikTok, FB"
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ช่องทางบริการ:</label>
                        <input
                          type="text"
                          value={smmPlatform}
                          onChange={(e) => setSmmPlatform(e.target.value)}
                          placeholder="เช่น ig : ฟอล, tiktok : วิว"
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ประเภทผู้ติดตาม:</label>
                        <select
                          value={smmServiceType}
                          onChange={(e) => setSmmServiceType(e.target.value)}
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        >
                          <option value="ไทย">🇹🇭 ไทย (Thai)</option>
                          <option value="ต่างชาติ">🌎 ต่างชาติ (Foreign)</option>
                          <option value="ผสม">🔄 ผสม (Mixed)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ยอดผู้ติดตามเดิม:</label>
                        <input
                          type="number"
                          value={smmStartCount}
                          onChange={(e) => setSmmStartCount(e.target.value)}
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ยอดรวมเป้าหมาย:</label>
                        <input
                          type="number"
                          value={smmTargetCount}
                          onChange={(e) => setSmmTargetCount(e.target.value)}
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">ลิงก์ฝั่งสั่งซื้อ (SMM URL):</label>
                        <input
                          type="url"
                          value={smmUrl}
                          onChange={(e) => setSmmUrl(e.target.value)}
                          placeholder="ลิงก์ระบบ SMM ที่คุณสั่งซื้อ"
                          className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1 font-hand">เวลาที่ใช้ไป (เริ่มนับที่ 1):</label>
                        <input
                          type="text"
                          disabled
                          placeholder="คำนวณตามช่วงวันเริ่ม-เสร็จ"
                          className="w-full p-2 bg-neutral-100 border-2 border-pencil rounded-md text-sm font-hand opacity-60 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-pencil pt-3">
                      <span className="text-[10px] font-bold text-pencil-muted font-hand block mb-2">
                        🌎 ฝั่งบริการต่างชาติ (Foreign Follower Service)
                      </span>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">เป้าหมายจำนวนเพิ่ม:</label>
                          <input
                            type="number"
                            value={smmForeignAdded}
                            onChange={(e) => setSmmForeignAdded(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">จำนวนแถมต่างชาติ:</label>
                          <input
                            type="number"
                            value={smmForeignGift}
                            onChange={(e) => setSmmForeignGift(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ทำไปแล้วต่างชาติ:</label>
                          <input
                            type="number"
                            value={smmForeignDone}
                            onChange={(e) => setSmmForeignDone(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-pencil pt-3">
                      <span className="text-[10px] font-bold text-pencil-muted font-hand block mb-2">
                        🇹🇭 ฝั่งบริการไทย (Thai Follower Service)
                      </span>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">เป้าหมายจำนวนเพิ่ม:</label>
                          <input
                            type="number"
                            value={smmThaiAdded}
                            onChange={(e) => setSmmThaiAdded(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">จำนวนแถมไทย:</label>
                          <input
                            type="number"
                            value={smmThaiGift}
                            onChange={(e) => setSmmThaiGift(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ทำไปแล้วไทย:</label>
                          <input
                            type="number"
                            value={smmThaiDone}
                            onChange={(e) => setSmmThaiDone(e.target.value)}
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Summary Information & Date */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">รายได้ (ราคาขาย):</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">ต้นทุน (ค่าใช้จ่าย):</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">วันที่เริ่มงาน:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 font-hand">วันที่สิ้นสุดงาน (ถ้าเสร็จ):</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 font-hand">หมายเหตุ / บันทึกเพิ่มเติม:</label>
                  <textarea
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                    placeholder="เช่น สั่งร้านเหมี่ยวจิ 3000 ร้านตะวัน 2000"
                    className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  disabled={jobsSaving}
                  className="w-full sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded p-2 shadow-sketch"
                >
                  {jobsSaving ? <span className="font-hand">กำลังบันทึก...</span> : <span className="font-hand">บันทึกข้อมูลงานลงสมุดงาน</span>}
                </button>
              </form>
            </div>
          )}

          {/* Job Listing Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-paper sketch-border shadow-sketch transform rotate-0.5">
            <div className="flex items-center gap-1 bg-control p-1 sketch-border-sm">
              {[
                { id: 'all', label: 'ประเภทงานทั้งหมด' },
                { id: 'freelance', label: 'งานเสริม' },
                { id: 'main', label: 'งานหลัก' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilterJobType(type.id)}
                  className={`px-3 py-1 text-xs font-bold font-hand rounded transition-colors ${
                    filterJobType === type.id ? 'bg-pencil text-paper' : 'hover:bg-control/50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-control p-1 sketch-border-sm">
              {[
                { id: 'all', label: 'ทุกสถานะ' },
                { id: 'pending', label: 'รอคิว' },
                { id: 'in_progress', label: 'กำลังทำ' },
                { id: 'completed', label: 'เสร็จสิ้น' }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => setFilterJobStatus(status.id)}
                  className={`px-3 py-1 text-xs font-bold font-hand rounded transition-colors ${
                    filterJobStatus === status.id ? 'bg-pencil text-paper' : 'hover:bg-control/50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job List Output */}
          {jobsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-paper p-10 sketch-border shadow-sketch text-center text-pencil-muted font-hand">
              ไม่มีข้อมูลประวัติงานเสริม/งานฟาสต์เวิร์กในสมุดบันทึกเล่มนี้ ☕
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 📱 MOBILE VIEW: CARDS CONTAINER */}
              <div className="block lg:hidden space-y-4">
                {filteredJobs.map((job) => {
                  const calculations = getJobSMMCalculations(job);
                  const isSMM = job.category === 'fastwork_smm';
                  const details = job.details || {};
                  
                  return (
                    <div 
                      key={job.id} 
                      className={`bg-paper p-4 sketch-border shadow-sketch transform text-left space-y-3 flex flex-col justify-between ${
                        job.status === 'completed' ? 'opacity-70 rotate-0.5' : '-rotate-0.5'
                      }`}
                    >
                      {/* Top Row: Title, Type, Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full sketch-border-sm font-hand ${
                            job.job_type === 'main' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {job.job_type === 'main' ? 'งานหลัก' : 'งานเสริม'}
                          </span>
                          <h4 className="font-extrabold text-base md:text-lg font-hand leading-tight mt-1">
                            {job.title}
                          </h4>
                          {job.client_name && (
                            <p className="text-xs text-pencil-muted font-hand">
                              👤 ผู้ว่าจ้าง: {job.client_name}
                            </p>
                          )}
                        </div>

                        {/* Status Checkbox / Toggle */}
                        <button
                          onClick={() => handleToggleJobStatus(job.id, job.status)}
                          className={`px-3 py-1 rounded-md border-2 border-pencil font-hand text-xs font-bold transition-all shadow-sketch-sm ${
                            job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            job.status === 'in_progress' ? 'bg-sky-100 text-sky-800' : 'bg-stone-100 text-pencil-muted'
                          }`}
                        >
                          {job.status === 'completed' ? '✓ เสร็จแล้ว' :
                           job.status === 'in_progress' ? '⚡ กำลังทำ' : '💤 รอคิว'}
                        </button>
                      </div>

                      {/* Link Row */}
                      {(details.link || job.client_chat_url) && (
                        <div className="flex flex-wrap gap-2 text-xs border-t border-dashed border-pencil pt-2">
                          {details.link && (
                            <a 
                              href={details.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-1 font-hand text-sky-600 hover:underline"
                            >
                              <LinkIcon className="w-3.5 h-3.5" /> ช่องทางบริการ <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {job.client_chat_url && (
                            <a 
                              href={job.client_chat_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-1 font-hand text-indigo-600 hover:underline"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> แชทคุยงาน <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* SMM Specific Metrics (Follower Counters) */}
                      {isSMM && (
                        <div className="p-3 bg-control/40 sketch-border-sm space-y-2 text-xs">
                          <div className="flex justify-between items-center font-hand text-[10px] text-pencil-muted">
                            <span>🚀 {details.platform_service || 'ig : ฟอล'} ({details.service_type || 'ผสม'})</span>
                            <span>เดิม: {details.start_count?.toLocaleString()} ➔ เป้าหมาย: {calculations.totalTargetFollowers?.toLocaleString()}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-hand text-[10px]">
                              <span>ความคืบหน้าภาพรวม (+{calculations.totalDone} จากเป้า +{calculations.totalTargetToAdd})</span>
                              <span className="font-bold">{calculations.progressPercent}%</span>
                            </div>
                            <div className="w-full h-3 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
                              <div 
                                className="h-full bg-amber-400 rounded-sm sketch-border-sm transition-all duration-300"
                                style={{ width: `${calculations.progressPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Quick Follower Updates (Foreign/Thai) */}
                          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-dotted border-pencil">
                            
                            {/* Foreign Follower update row */}
                            {(Number(details.foreign_added) > 0) && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-hand text-[10px] text-pencil-muted">
                                  🌎 ต่างชาติ: +{details.foreign_done} / +{(Number(details.foreign_added) || 0) + (Number(details.foreign_gift) || 0)} (ค้าง {calculations.remainingForeign})
                                </span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleUpdateDoneCount(job.id, 'foreign', 100)}
                                    className="px-1.5 py-0.5 text-[9px] font-hand border border-pencil rounded bg-control"
                                  >
                                    +100
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateDoneCount(job.id, 'foreign', 500)}
                                    className="px-1.5 py-0.5 text-[9px] font-hand border border-pencil rounded bg-control"
                                  >
                                    +500
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Thai Follower update row */}
                            {(Number(details.thai_added) > 0) && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-hand text-[10px] text-pencil-muted">
                                  🇹🇭 ไทย: +{details.thai_done} / +{(Number(details.thai_added) || 0) + (Number(details.thai_gift) || 0)} (ค้าง {calculations.remainingThai})
                                </span>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleUpdateDoneCount(job.id, 'thai', 50)}
                                    className="px-1.5 py-0.5 text-[9px] font-hand border border-pencil rounded bg-control"
                                  >
                                    +50
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateDoneCount(job.id, 'thai', 100)}
                                    className="px-1.5 py-0.5 text-[9px] font-hand border border-pencil rounded bg-control"
                                  >
                                    +100
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {details.smm_url && (
                            <div className="pt-1.5 border-t border-dotted border-pencil">
                              <a 
                                href={details.smm_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[10px] text-pencil-muted underline font-hand truncate block"
                              >
                                🔗 ลิงก์ใบสั่งซื้อ SMM: {details.smm_url}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* General details / Job Dates & Profit */}
                      <div className="grid grid-cols-3 gap-2 text-xs border-t border-dashed border-pencil pt-2 font-hand">
                        <div>
                          <span className="text-[9px] text-pencil-muted block">รายรับ</span>
                          <span className="font-bold text-emerald-600">฿{Number(job.price).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-pencil-muted block">ค่าใช้จ่าย</span>
                          <span className="font-bold text-rose-600">฿{Number(job.cost).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-pencil-muted block">กำไร</span>
                          <span className="font-bold text-blue-600">฿{calculations.profit.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Date & Action */}
                      <div className="flex justify-between items-center text-[10px] text-pencil-muted pt-2 font-hand">
                        <span>
                          📅 {new Date(job.start_date).toLocaleDateString('th-TH')}
                          {job.end_date ? ` ถึง ${new Date(job.end_date).toLocaleDateString('th-TH')}` : ` (ใช้ไป ${calculations.daysSpent} วัน)`}
                        </span>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 💻 DESKTOP VIEW: FULL TABLE SCROLL CONTAINER */}
              <div className="hidden lg:block bg-paper sketch-border shadow-sketch p-4 overflow-x-auto">
                <table className="w-full border-collapse text-left font-hand text-sm min-w-[1100px]">
                  <thead>
                    <tr className="border-b-2 border-pencil text-pencil-muted text-xs">
                      <th className="py-2 px-3">ประเภท</th>
                      <th className="py-2 px-3">ชื่องาน/ลิงก์</th>
                      <th className="py-2 px-3">ผู้ว่าจ้าง</th>
                      <th className="py-2 px-3">บริการ</th>
                      <th className="py-2 px-3">เดิม/เป้าหมาย</th>
                      <th className="py-2 px-3">เพิ่มฟอลและแถม</th>
                      <th className="py-2 px-3">เสร็จ/ค้าง</th>
                      <th className="py-2 px-3 text-right">รายรับ</th>
                      <th className="py-2 px-3 text-right">ต้นทุน</th>
                      <th className="py-2 px-3 text-right">กำไร</th>
                      <th className="py-2 px-3">วันที่เริ่ม-เสร็จ</th>
                      <th className="py-2 px-3 text-center">สถานะ</th>
                      <th className="py-2 px-3 text-center">ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => {
                      const calculations = getJobSMMCalculations(job);
                      const isSMM = job.category === 'fastwork_smm';
                      const details = job.details || {};
                      
                      return (
                        <tr 
                          key={job.id} 
                          className={`border-b border-dashed border-pencil hover:bg-control/25 transition-colors ${
                            job.status === 'completed' ? 'opacity-60 bg-control/10' : ''
                          }`}
                        >
                          {/* Type */}
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full sketch-border-sm ${
                              job.job_type === 'main' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {job.job_type === 'main' ? 'งานหลัก' : 'งานเสริม'}
                            </span>
                          </td>

                          {/* Title / Link */}
                          <td className="py-3 px-3 max-w-[200px] truncate">
                            <div className="font-extrabold">{job.title}</div>
                            {details.link && (
                              <a 
                                href={details.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-sky-600 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <LinkIcon className="w-3 h-3" /> เปิดโปรไฟล์
                              </a>
                            )}
                          </td>

                          {/* Client */}
                          <td className="py-3 px-3">
                            {job.client_name ? (
                              <div className="font-bold">{job.client_name}</div>
                            ) : (
                              <span className="text-pencil-muted">-</span>
                            )}
                            {job.client_chat_url && (
                              <a 
                                href={job.client_chat_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" /> เปิดแชทงาน
                              </a>
                            )}
                          </td>

                          {/* Platform/Service */}
                          <td className="py-3 px-3">
                            {isSMM ? (
                              <div>
                                <span className="font-bold block">{details.platform_service}</span>
                                <span className="text-[10px] text-pencil-muted">({details.service_type})</span>
                              </div>
                            ) : (
                              <span className="text-pencil-muted">งานทั่วไป</span>
                            )}
                          </td>

                          {/* Start / Target Count */}
                          <td className="py-3 px-3">
                            {isSMM ? (
                              <div>
                                <span className="text-xs text-pencil-muted block">เดิม: {details.start_count?.toLocaleString()}</span>
                                <span className="font-bold text-xs text-pencil">เป้า: {calculations.totalTargetFollowers?.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="text-pencil-muted">-</span>
                            )}
                          </td>

                          {/* Added and Gift (Thai/Foreign) */}
                          <td className="py-3 px-3 text-xs">
                            {isSMM ? (
                              <div className="space-y-0.5">
                                {Number(details.foreign_added) > 0 && (
                                  <div className="text-[10px] text-pencil-muted">
                                    🌎 ตจ. +{details.foreign_added} {Number(details.foreign_gift) > 0 && `(แถม +${details.foreign_gift})`}
                                  </div>
                                )}
                                {Number(details.thai_added) > 0 && (
                                  <div className="text-[10px] text-pencil-muted">
                                    🇹🇭 ไทย +{details.thai_added} {Number(details.thai_gift) > 0 && `(แถม +${details.thai_gift})`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-pencil-muted">-</span>
                            )}
                          </td>

                          {/* Progress Done / Remaining / Increments */}
                          <td className="py-3 px-3">
                            {isSMM ? (
                              <div className="space-y-1 max-w-[180px]">
                                {Number(details.foreign_added) > 0 && (
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span>🌎 ค้าง: {calculations.remainingForeign}</span>
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => handleUpdateDoneCount(job.id, 'foreign', 100)}
                                        className="px-1 font-bold border border-pencil rounded bg-control text-[9px]"
                                      >
                                        +100
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateDoneCount(job.id, 'foreign', 500)}
                                        className="px-1 font-bold border border-pencil rounded bg-control text-[9px]"
                                      >
                                        +500
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {Number(details.thai_added) > 0 && (
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span>🇹🇭 ค้าง: {calculations.remainingThai}</span>
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => handleUpdateDoneCount(job.id, 'thai', 50)}
                                        className="px-1 font-bold border border-pencil rounded bg-control text-[9px]"
                                      >
                                        +50
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateDoneCount(job.id, 'thai', 100)}
                                        className="px-1 font-bold border border-pencil rounded bg-control text-[9px]"
                                      >
                                        +100
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-pencil-muted">-</span>
                            )}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                            ฿{Number(job.price).toLocaleString()}
                          </td>

                          {/* Cost */}
                          <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                            ฿{Number(job.cost).toLocaleString()}
                          </td>

                          {/* Profit */}
                          <td className="py-3 px-3 text-right font-extrabold text-blue-600">
                            ฿{calculations.profit.toLocaleString()}
                          </td>

                          {/* Dates */}
                          <td className="py-3 px-3 text-xs text-pencil-muted">
                            <div>เริ่ม: {new Date(job.start_date).toLocaleDateString('th-TH')}</div>
                            <div>
                              {job.end_date 
                                ? `เสร็จ: ${new Date(job.end_date).toLocaleDateString('th-TH')}` 
                                : `ทำมาแล้ว ${calculations.daysSpent} วัน`}
                            </div>
                          </td>

                          {/* Status buttons */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleJobStatus(job.id, job.status)}
                              className={`px-3 py-1 rounded-md border-2 border-pencil font-hand text-xs font-bold transition-all shadow-sketch-sm ${
                                job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                job.status === 'in_progress' ? 'bg-sky-100 text-sky-800' : 'bg-stone-100 text-pencil-muted'
                              }`}
                            >
                              {job.status === 'completed' ? 'เสร็จสิ้น ✓' :
                               job.status === 'in_progress' ? 'กำลังทำ ⚡' : 'รอคิว 💤'}
                            </button>
                          </td>

                          {/* Delete */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
