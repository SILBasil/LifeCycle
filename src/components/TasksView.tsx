import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ListTodo, Plus, Trash2, Calendar, Folder, Loader2 } from 'lucide-react';

interface TasksViewProps {
  userId: string;
}

export const TasksView: React.FC<TasksViewProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);

      // Extract unique project names
      const uniqueProjects = Array.from(
        new Set((data || []).map((t: any) => t.project_name || 'General'))
      ) as string[];
      setProjects(uniqueProjects);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

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
    // Rotation: todo -> doing -> done -> todo
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

  // Filter logic
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const projectMatch = filterProject === 'all' || (task.project_name || 'General') === filterProject;
    return statusMatch && projectMatch;
  });

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Stats Card */}
      <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-extrabold font-hand flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-emerald-500" />
            รายการงานที่ต้องจัดการ (Tasks & Work)
          </h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="sketch-button bg-emerald-50 text-emerald-800 text-xs rounded sketch-border-sm shadow-sketch-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="font-hand">จดหัวใช้งานใหม่</span>
            </button>
          )}
        </div>

        {/* Progress Tracker */}
        {tasks.length > 0 && (
          <div className="mt-6 p-4 bg-control/50 sketch-border-sm">
            <div className="flex justify-between items-center text-sm font-hand mb-2">
              <span>ความคืบหน้าการทำงาน ({completedCount} / {tasks.length} งาน)</span>
              <span className="font-bold">{progressPercent}% สำเร็จ</span>
            </div>
            <div className="w-full h-4 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
              <div 
                className="h-full bg-emerald-400 rounded-sm sketch-border-sm transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 text-left">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-neutral-300">
            <h3 className="text-lg font-extrabold font-hand">✏️ เขียนใบงานใหม่</h3>
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
                placeholder="เช่น เขียนบทสรุปส่งลูกค้า, เตรียมเอกสารประชุม"
                className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 font-hand">รายละเอียดงาน:</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="ระบุสิ่งที่ต้องทำเพิ่มเติม"
                className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 font-hand">โปรเจกต์ / หมวดหมู่:</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  placeholder="General, Work, Personal"
                  className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 font-hand">ความสำคัญ:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                >
                  <option value="high">🔴 ด่วนมาก (High)</option>
                  <option value="medium">🟡 ปานกลาง (Medium)</option>
                  <option value="low">🟢 ต่ำ (Low)</option>
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
              {saving ? <span className="font-hand">กำลังจด...</span> : <span className="font-hand">จดบันทึกงานลงสมุด</span>}
            </button>
          </form>
        </div>
      )}

      {/* Filters Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-paper sketch-border shadow-sketch transform rotate-0.5">
        {/* Status Filters */}
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
                filterStatus === status.id ? 'bg-pencil text-white' : 'hover:bg-neutral-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Project Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-hand text-pencil-muted">กรองตามโปรเจกต์:</span>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="p-1 text-xs font-bold font-hand bg-control sketch-border-sm focus:outline-none"
          >
            <option value="all">📁 โปรเจกต์ทั้งหมด</option>
            {projects.map((proj, i) => (
              <option key={i} value={proj}>
                📁 {proj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
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
                {/* Hand-drawn checkbox */}
                <button
                  onClick={() => handleToggleStatus(task.id, task.status)}
                  className={`w-6 h-6 rounded-md border-2 border-pencil flex-shrink-0 flex items-center justify-center font-extrabold text-sm font-hand transition-all ${
                    isDone ? 'bg-emerald-100 text-emerald-800 line-through' :
                    isDoing ? 'bg-amber-100 text-amber-800' : 'bg-transparent'
                  }`}
                >
                  {isDone ? '✓' : isDoing ? '/' : ''}
                </button>

                {/* Content */}
                <div className="flex-grow space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-bold text-lg font-hand ${isDone ? 'line-through text-pencil-muted' : ''}`}>
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

                {/* Action button */}
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
  );
};
