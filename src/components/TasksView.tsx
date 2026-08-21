import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ListTodo, Plus, Trash2, Calendar, Folder, Loader2, 
  Briefcase, Link as LinkIcon, 
  MessageSquare, ExternalLink, AlertCircle,
  Edit3, X, Tag, Search, FileSpreadsheet, Download, Copy, Check
} from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import { 
  syncJobsToGoogleSheet, 
  downloadJobsAsCSV, 
  getGoogleSheetWebhookUrl, 
  setGoogleSheetWebhookUrl,
  GOOGLE_APPS_SCRIPT_SAMPLE 
} from '../lib/googleSheetSync';

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
  const [fetchingJobIds, setFetchingJobIds] = useState<Set<string>>(new Set());

  // Channels management states
  const [channels, setChannels] = useState<any[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [showChannelManage, setShowChannelManage] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [channelSaving, setChannelSaving] = useState(false);

  // Filters for jobs (default status is 'กำลังดำเนินการ')
  const [filterChannelId, setFilterChannelId] = useState<string>('all');
  const [filterJobStatus, setFilterJobStatus] = useState<string>('กำลังดำเนินการ');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  // Job Form states (for Add/Edit)
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState<'fastwork_smm' | 'other_freelance'>('fastwork_smm');
  const [clientName, setClientName] = useState('');
  const [clientChatUrl, setClientChatUrl] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // SMM detailed states
  const [smmLink, setSmmLink] = useState('');
  const [smmAccountName, setSmmAccountName] = useState('');
  const [smmPlatform, setSmmPlatform] = useState('ig : ฟอล');
  const [smmServiceType, setSmmServiceType] = useState('ไทย');
  const [smmStartCount, setSmmStartCount] = useState('');
  const [smmTargetCount, setSmmTargetCount] = useState('');
  const [smmForeignAdded, setSmmForeignAdded] = useState('');
  const [smmForeignGift, setSmmForeignGift] = useState('');
  const [smmForeignDone, setSmmForeignDone] = useState('');
  const [smmThaiAdded, setSmmThaiAdded] = useState('');
  const [smmThaiGift, setSmmThaiGift] = useState('');
  const [smmThaiDone, setSmmThaiDone] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [smmProviderInfo, setSmmProviderInfo] = useState('');
  const [jobStatus, setJobStatus] = useState<string>('กำลังดำเนินการ');

  // Search state for freelance jobs
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Google Sheets sync states
  const [syncingSheet, setSyncingSheet] = useState<boolean>(false);
  const [showGSheetModal, setShowGSheetModal] = useState<boolean>(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState<string>(getGoogleSheetWebhookUrl());
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Editing state
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [tempCurrentCount, setTempCurrentCount] = useState<string>('');

  const fetchChannels = async () => {
    try {
      setChannelsLoading(true);
      const { data, error } = await supabase
        .from('freelance_channels')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setChannels([]);
          return;
        }
        throw error;
      }

      if (data && data.length === 0) {
        // Auto-seed default channels
        const defaultChannels = [
          { user_id: userId, name: 'Fastwork', services: ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'] },
          { user_id: userId, name: 'ลูกค้าโดยตรง', services: ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'] },
          { user_id: userId, name: 'Facebook', services: ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'] },
          { user_id: userId, name: 'Line', services: ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'] }
        ];
        const { data: seeded, error: seedError } = await supabase
          .from('freelance_channels')
          .insert(defaultChannels)
          .select();

        if (seedError) {
          console.error('Error seeding default channels:', seedError);
        } else {
          setChannels(seeded || []);
        }
      } else {
        setChannels(data || []);
      }
    } catch (err) {
      console.error('Error fetching freelance channels:', err);
    } finally {
      setChannelsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const { data, error } = await supabase
        .from('freelance_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setJobs([]);
          return;
        }
        throw error;
      }

      const loadedJobs = data || [];
      const now = new Date().getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const jobsToAutoClose: string[] = [];

      // Auto-transition completed jobs ("เสร็จสิ้น") older than 3 days to "เสร็จสิ้นปิดงานแล้ว"
      const processedJobs = loadedJobs.map((job: any) => {
        if (job.status === 'เสร็จสิ้น') {
          const compDateStr = job.end_date || job.updated_at || job.created_at;
          if (compDateStr) {
            const compTime = new Date(compDateStr).getTime();
            if (!isNaN(compTime) && (now - compTime >= threeDaysMs)) {
              jobsToAutoClose.push(job.id);
              return { ...job, status: 'เสร็จสิ้นปิดงานแล้ว' };
            }
          }
        }
        return job;
      });

      setJobs(processedJobs);

      // Async database update for expired jobs
      if (jobsToAutoClose.length > 0) {
        supabase
          .from('freelance_jobs')
          .update({ status: 'เสร็จสิ้นปิดงานแล้ว' })
          .in('id', jobsToAutoClose)
          .eq('user_id', userId)
          .then(({ error: autoErr }) => {
            if (autoErr) console.error('Error auto-closing expired jobs:', autoErr);
            else console.log(`Auto-closed ${jobsToAutoClose.length} jobs completed over 3 days ago.`);
          });
      }
    } catch (err) {
      console.error('Error fetching freelance jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleSyncGoogleSheet = async (customUrl?: string) => {
    const targetUrl = customUrl !== undefined ? customUrl : getGoogleSheetWebhookUrl();
    if (!targetUrl) {
      setShowGSheetModal(true);
      return;
    }

    try {
      setSyncingSheet(true);
      const res = await syncJobsToGoogleSheet(jobs, channels, targetUrl);
      alert(res.message);
      if (res.success) {
        setShowGSheetModal(false);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการซิงค์: ' + (err.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setSyncingSheet(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      setChannelSaving(true);
      const { data, error } = await supabase
        .from('freelance_channels')
        .insert({
          user_id: userId,
          name: newChannelName.trim()
        })
        .select();

      if (error) throw error;
      setChannels([...channels, ...(data || [])]);
      setNewChannelName('');
    } catch (err) {
      console.error('Error adding channel:', err);
    } finally {
      setChannelSaving(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!window.confirm('คุณต้องการลบช่องทางรับงานนี้ใช่หรือไม่? งานเสริมที่ผูกอยู่จะไม่มีช่องทางแสดงผล')) return;
    try {
      const { error } = await supabase
        .from('freelance_channels')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setChannels(channels.filter(c => c.id !== id));
      if (selectedChannelId === id) setSelectedChannelId('');
      if (filterChannelId === id) setFilterChannelId('all');
    } catch (err) {
      console.error('Error deleting channel:', err);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    try {
      setJobsSaving(true);
      
      const payload: any = {
        user_id: userId,
        title: jobTitle.trim(),
        channel_id: selectedChannelId || null,
        client_name: clientName.trim() || null,
        client_chat_url: clientChatUrl.trim() || null,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        start_date: startDate || new Date().toISOString().split('T')[0],
        end_date: endDate || null,
        status: jobStatus === 'ยังไม่เริ่ม' ? 'กำลังดำเนินการ' : jobStatus,
        notes: jobNotes.trim() || null,
        category: jobCategory,
        // SMM fields
        link: smmLink.trim() || null,
        account_name: smmAccountName.trim() || null,
        platform: smmPlatform || null,
        service_type: smmServiceType || null,
        start_count: Number(smmStartCount) || 0,
        target_count: Number(smmTargetCount) || 0,
        foreign_added: Number(smmForeignAdded) || 0,
        foreign_gift: Number(smmForeignGift) || 0,
        foreign_done: Number(smmForeignDone) || 0,
        thai_added: Number(smmThaiAdded) || 0,
        thai_gift: Number(smmThaiGift) || 0,
        thai_done: Number(smmThaiDone) || 0,
        provider_info: smmProviderInfo.trim() || null
      };

      const { error } = await supabase.from('freelance_jobs').insert(payload);

      if (error) throw error;

      // Reset Job Form
      setJobTitle('');
      setSelectedChannelId('');
      setClientName('');
      setClientChatUrl('');
      setPrice('');
      setCost('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setSmmLink('');
      setSmmAccountName('');
      setSmmPlatform('ig : ฟอล');
      setSmmServiceType('ไทย');
      setSmmStartCount('');
      setSmmTargetCount('');
      setSmmForeignAdded('');
      setSmmForeignGift('');
      setSmmForeignDone('');
      setSmmThaiAdded('');
      setSmmThaiGift('');
      setSmmThaiDone('');
      setJobNotes('');
      setSmmProviderInfo('');
      setJobStatus('กำลังดำเนินการ');
      setShowAddJobForm(false);
      
      fetchJobs();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกงาน: กรุณาตรวจสอบว่าได้สร้างตารางใน Supabase SQL Editor เรียบร้อยแล้ว');
      console.error('Error adding freelance job:', err);
    } finally {
      setJobsSaving(false);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    try {
      setJobsSaving(true);
      
      const payload: any = {
        title: jobTitle.trim(),
        channel_id: selectedChannelId || null,
        client_name: clientName.trim() || null,
        client_chat_url: clientChatUrl.trim() || null,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        start_date: startDate,
        end_date: endDate || null,
        status: jobStatus,
        notes: jobNotes.trim() || null,
        category: jobCategory,
        // SMM fields
        link: smmLink.trim() || null,
        account_name: smmAccountName.trim() || null,
        platform: smmPlatform || null,
        service_type: smmServiceType || null,
        start_count: Number(smmStartCount) || 0,
        target_count: Number(smmTargetCount) || 0,
        foreign_added: Number(smmForeignAdded) || 0,
        foreign_gift: Number(smmForeignGift) || 0,
        foreign_done: Number(smmForeignDone) || 0,
        thai_added: Number(smmThaiAdded) || 0,
        thai_gift: Number(smmThaiGift) || 0,
        thai_done: Number(smmThaiDone) || 0,
        provider_info: smmProviderInfo.trim() || null
      };

      const { error } = await supabase
        .from('freelance_jobs')
        .update(payload)
        .eq('id', editingJob.id)
        .eq('user_id', userId);

      if (error) throw error;

      setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, ...payload } : j));
      
      // Close editing and reset form
      setEditingJob(null);
      setJobTitle('');
      setSelectedChannelId('');
      setClientName('');
      setClientChatUrl('');
      setPrice('');
      setCost('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setSmmLink('');
      setSmmAccountName('');
      setSmmPlatform('ig : ฟอล');
      setSmmServiceType('ไทย');
      setSmmStartCount('');
      setSmmTargetCount('');
      setSmmForeignAdded('');
      setSmmForeignGift('');
      setSmmForeignDone('');
      setSmmThaiAdded('');
      setSmmThaiGift('');
      setSmmThaiDone('');
      setJobNotes('');
      setSmmProviderInfo('');
      setJobStatus('กำลังดำเนินการ');
      
      fetchJobs();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการแก้ไขงาน');
      console.error('Error updating freelance job:', err);
    } finally {
      setJobsSaving(false);
    }
  };

  const startEditJob = (job: any) => {
    setEditingJob(job);
    setJobTitle(job.title || '');
    setSelectedChannelId(job.channel_id || '');
    setClientName(job.client_name || '');
    setClientChatUrl(job.client_chat_url || '');
    setPrice(job.price ? String(job.price) : '');
    setCost(job.cost ? String(job.cost) : '');
    setStartDate(job.start_date || new Date().toISOString().split('T')[0]);
    setEndDate(job.end_date || '');
    setJobCategory(job.category || 'fastwork_smm');
    setSmmLink(job.link || '');
    setSmmAccountName(job.account_name || '');
    setSmmPlatform(job.platform || 'ig : ฟอล');
    setSmmServiceType(job.service_type || 'ไทย');
    setSmmStartCount(job.start_count ? String(job.start_count) : '');
    setSmmTargetCount(job.target_count ? String(job.target_count) : '');
    setSmmForeignAdded(job.foreign_added ? String(job.foreign_added) : '');
    setSmmForeignGift(job.foreign_gift ? String(job.foreign_gift) : '');
    setSmmForeignDone(job.foreign_done ? String(job.foreign_done) : '');
    setSmmThaiAdded(job.thai_added ? String(job.thai_added) : '');
    setSmmThaiGift(job.thai_gift ? String(job.thai_gift) : '');
    setSmmThaiDone(job.thai_done ? String(job.thai_done) : '');
    setJobNotes(job.notes || '');
    setSmmProviderInfo(job.provider_info || '');
    setJobStatus(job.status || 'กำลังดำเนินการ');
    const currentFollowers = (Number(job.start_count) || 0) + (Number(job.foreign_done) || 0) + (Number(job.thai_done) || 0);
    setTempCurrentCount(String(currentFollowers));
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
    let nextStatus = 'ยังไม่เริ่ม';
    let dateFinished: string | null = null;
    
    if (currentStatus === 'ยังไม่เริ่ม') {
      nextStatus = 'กำลังดำเนินการ';
    } else if (currentStatus === 'กำลังดำเนินการ') {
      nextStatus = 'เสร็จสิ้น';
      dateFinished = new Date().toISOString().split('T')[0];
    } else if (currentStatus === 'เสร็จสิ้น') {
      nextStatus = 'เสร็จสิ้นปิดงานแล้ว';
      dateFinished = new Date().toISOString().split('T')[0];
    } else {
      nextStatus = 'ยังไม่เริ่ม';
    }
    
    try {
      const updateData: any = { status: nextStatus };
      if (nextStatus === 'เสร็จสิ้น' || nextStatus === 'เสร็จสิ้นปิดงานแล้ว') {
        updateData.end_date = dateFinished;
      } else {
        updateData.end_date = null;
      }

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

  const handleAutoFetchCount = (jobId: string, profileUrl: string) => {
    if (!profileUrl) {
      alert("ไม่พบลิงก์โปรไฟล์สำหรับดึงข้อมูล");
      return;
    }

    setFetchingJobIds(prev => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });

    let timeoutId: number;

    const onResponse = async (event: MessageEvent) => {
      if (event.data && event.data.type === "SMM_EXTENSION_RESPONSE" && event.data.url === profileUrl) {
        window.removeEventListener("message", onResponse);
        clearTimeout(timeoutId);

        if (event.data.error) {
          alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + event.data.error);
          setFetchingJobIds(prev => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
          return;
        }

        const freshCount = event.data.count;
        if (freshCount !== null && freshCount !== undefined) {
          await handleUpdateCurrentCount(jobId, freshCount);
        }

        setFetchingJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });

        if (freshCount !== null && freshCount !== undefined) {
          setTimeout(() => {
            alert(`ดึงยอดผู้ติดตามสำเร็จ: ${freshCount.toLocaleString()} คน!`);
          }, 50);
        } else {
          alert("ไม่พบยอดผู้ติดตามจากการค้นหา");
        }
      }
    };

    // ตั้งเวลา timeout 20 วินาที เพื่อรองรับการเปิดหน้าเว็บซ่อนเบื้องหลังของ Extension
    timeoutId = window.setTimeout(() => {
      window.removeEventListener("message", onResponse);
      setFetchingJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      alert("ไม่สามารถติดต่อ Extension ได้ กรุณาติดตั้งหรือเปิดใช้ Chrome Extension 'LifeCycle SMM Auto-Fetcher'");
    }, 20000);

    window.addEventListener("message", onResponse);

    // ส่งข้อมูลไปหา Extension
    window.postMessage({ type: "SMM_EXTENSION_REQUEST", url: profileUrl }, "*");
  };


  const handleUpdateCurrentCount = async (jobId: string, currentCountVal: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const start = Number(job.start_count) || 0;
    const totalDone = Math.max(0, currentCountVal - start);
    
    const updateData: any = {};
    if (job.service_type === 'ไทย') {
      updateData.thai_done = totalDone;
    } else if (job.service_type === 'ต่างชาติ') {
      updateData.foreign_done = totalDone;
    } else {
      const foreignTarget = (Number(job.foreign_added) || 0) + (Number(job.foreign_gift) || 0);
      const foreignDone = Math.min(foreignTarget, totalDone);
      const thaiDone = Math.max(0, totalDone - foreignDone);
      
      updateData.foreign_done = foreignDone;
      updateData.thai_done = thaiDone;
    }
    
    try {
      const { error } = await supabase
        .from('freelance_jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;
      setJobs(jobs.map(j => j.id === jobId ? { ...j, ...updateData } : j));
    } catch (err) {
      console.error('Error updating current count:', err);
    }
  };

  // Calculations helper for SMM metrics
  const getJobSMMCalculations = (job: any) => {
    const startCount = Number(job.start_count) || 0;
    
    const foreignAdded = Number(job.foreign_added) || 0;
    const foreignGift = Number(job.foreign_gift) || 0;
    const foreignDone = Number(job.foreign_done) || 0;
    
    const thaiAdded = Number(job.thai_added) || 0;
    const thaiGift = Number(job.thai_gift) || 0;
    const thaiDone = Number(job.thai_done) || 0;
    
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
    fetchChannels();
    fetchJobs();
  }, [userId]);

  // Auto-calculate SMM Target Count (Start + Added counts)
  useEffect(() => {
    const start = Number(smmStartCount) || 0;
    const addedThai = Number(smmThaiAdded) || 0;
    const addedForeign = Number(smmForeignAdded) || 0;
    const target = start + addedThai + addedForeign;
    setSmmTargetCount(String(target));
  }, [smmStartCount, smmThaiAdded, smmForeignAdded]);

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
    const channelMatch = filterChannelId === 'all' || (job.channel_id === (filterChannelId === '' ? null : filterChannelId));
    const statusMatch = filterJobStatus === 'all' || job.status === filterJobStatus;
    const platformMatch = filterPlatform === 'all' 
      ? true 
      : filterPlatform === 'other'
        ? job.category !== 'fastwork_smm'
        : job.platform === filterPlatform;

    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const title = (job.title || '').toLowerCase();
      const accountName = (job.account_name || '').toLowerCase();
      const clientName = (job.client_name || '').toLowerCase();
      const chatUrl = (job.client_chat_url || '').toLowerCase();
      const notes = (job.notes || '').toLowerCase();
      const providerInfo = (job.provider_info || '').toLowerCase();
      const platform = (job.platform || '').toLowerCase();
      const serviceType = (job.service_type || '').toLowerCase();

      // Extract numeric ID from chat URL if present (e.g. 123456)
      const chatOrderIdMatch = chatUrl.match(/(\d+)/);
      const chatOrderId = chatOrderIdMatch ? chatOrderIdMatch[1] : '';

      searchMatch = title.includes(q) ||
        accountName.includes(q) ||
        clientName.includes(q) ||
        chatUrl.includes(q) ||
        chatOrderId.includes(q) ||
        notes.includes(q) ||
        providerInfo.includes(q) ||
        platform.includes(q) ||
        serviceType.includes(q);
    }

    return channelMatch && statusMatch && platformMatch && searchMatch;
  });

  // Freelance stats summary
  const activeJobsCount = jobs.filter(j => j.status !== 'เสร็จสิ้น' && j.status !== 'เสร็จสิ้นปิดงานแล้ว').length;

  const getAvailableServices = () => {
    if (filterChannelId === 'all') {
      const allServices = new Set<string>();
      channels.forEach((c: any) => {
        if (c.services && Array.isArray(c.services)) {
          c.services.forEach((s: string) => allServices.add(s));
        }
      });
      const servicesArr = Array.from(allServices);
      return servicesArr.length > 0 ? servicesArr : ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'];
    } else if (filterChannelId === '') {
      return ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'];
    } else {
      const selectedChan = channels.find(c => c.id === filterChannelId);
      return selectedChan?.services && selectedChan.services.length > 0
        ? selectedChan.services
        : ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'];
    }
  };

  const getFormAvailableServices = (chanId: string) => {
    if (!chanId) {
      return ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'];
    }
    const selectedChan = channels.find(c => c.id === chanId);
    return selectedChan?.services && selectedChan.services.length > 0
      ? selectedChan.services
      : ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ'];
  };

  const getCleanJobTitle = (job: any) => {
    if (job.account_name) {
      return `@${job.account_name}`;
    }
    if (job.title && (job.title.includes('http') || job.title.startsWith('งานของ http'))) {
      if (job.platform) {
        return job.platform;
      }
      return 'งานบริการ SMM';
    }
    return job.title;
  };

  const extractUsernameFromLink = (link: string): string | null => {
    if (!link) return null;
    try {
      const cleanLink = link.startsWith('http') ? link : `https://${link}`;
      const urlObj = new URL(cleanLink);
      const hostname = urlObj.hostname.toLowerCase();
      const path = urlObj.pathname;
      
      if (hostname.includes('instagram.com')) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0) {
          const first = parts[0];
          if (!['p', 'reel', 'reels', 'stories', 'tv'].includes(first.toLowerCase())) {
            return first;
          }
        }
      }
      
      if (hostname.includes('tiktok.com')) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0) {
          const first = parts[0];
          if (first.startsWith('@')) {
            return first.substring(1);
          }
          return first;
        }
      }
    } catch (e) {
      // Ignore URL parse errors
    }
    return null;
  };

  const handleSmmLinkChange = (value: string) => {
    setSmmLink(value);
    const extracted = extractUsernameFromLink(value);
    if (extracted) {
      if (!smmAccountName) {
        setSmmAccountName(extracted);
      }
      if (!jobTitle) {
        setJobTitle(extracted);
      }
    }
  };

  const handleChatUrlChange = (value: string) => {
    let cleanVal = value.trim();
    if (cleanVal) {
      // Check if it is a pure numeric ID (e.g. 123456)
      if (/^\d+$/.test(cleanVal)) {
        cleanVal = `https://chat.fastwork.co/message/${cleanVal}`;
      } else if (cleanVal.toLowerCase().startsWith('message/')) {
        const id = cleanVal.split('/')[1];
        if (id) {
          cleanVal = `https://chat.fastwork.co/message/${id}`;
        }
      }
    }
    setClientChatUrl(cleanVal);
  };

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
                    <CustomSelect
                      value={newPriority}
                      onChange={(val) => setNewPriority(val)}
                      options={[
                        { value: 'high', label: '🔴 ด่วน (High)' },
                        { value: 'medium', label: '🟡 ปกติ (Medium)' },
                        { value: 'low', label: '🟢 สบายๆ (Low)' }
                      ]}
                    />
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
              <div className="w-40">
                <CustomSelect
                  value={filterProject}
                  onChange={(val) => setFilterProject(val)}
                  options={[
                    { value: 'all', label: '📁 โปรเจกต์ทั้งหมด' },
                    ...projects.map(proj => ({ value: proj, label: `📁 ${proj}` }))
                  ]}
                  size="sm"
                />
              </div>
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
          <div className="flex gap-4">
            <div className="bg-paper p-3 sketch-border shadow-sketch flex flex-col justify-between min-w-[200px]">
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
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowAddJobForm(true)}
                  className="sketch-button bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs rounded sketch-border-sm shadow-sketch-sm justify-center py-2 px-3 flex-grow sm:flex-grow-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-hand font-bold">บันทึกงานชิ้นใหม่</span>
                </button>
                <button
                  onClick={() => handleSyncGoogleSheet()}
                  disabled={syncingSheet}
                  className="sketch-button bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs rounded sketch-border-sm shadow-sketch-sm justify-center py-2 px-3 flex-grow sm:flex-grow-0"
                  title="ซิงค์ข้อมูลงานเสริมไปยัง Google Sheet"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-hand font-bold">{syncingSheet ? 'กำลังซิงค์...' : 'ซิงค์ไป Google Sheet'}</span>
                </button>
                <button
                  onClick={() => downloadJobsAsCSV(jobs, channels)}
                  className="sketch-button bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs rounded sketch-border-sm shadow-sketch-sm justify-center py-2 px-3 flex-grow sm:flex-grow-0"
                  title="ดาวน์โหลดข้อมูลเป็นไฟล์ CSV สำหรับเปิดใน Excel หรือ Google Sheet"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span className="font-hand font-bold">ส่งออก CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* 🪟 Add Job Modal Popup */}
          {showAddJobForm && (
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-paper p-6 sketch-border shadow-sketch w-full max-w-3xl transform rotate-0.5 text-left space-y-4 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-pencil">
                  <h3 className="text-base md:text-lg font-extrabold font-hand flex items-center gap-2">
                    <Plus className="w-5 h-5 text-amber-500" /> ✏️ บันทึกรายละเอียดงานใหม่
                  </h3>
                  <button onClick={() => setShowAddJobForm(false)} className="p-1 hover:bg-control/50 rounded-full sketch-border-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Category Template Switcher */}
                <div className="mb-4">
                  <label className="block text-xs font-bold mb-1.5 font-hand text-pencil-muted">กรุณาเลือกรูปแบบเทมเพลตงาน:</label>
                  <div className="grid grid-cols-2 gap-2 bg-control/30 p-1 sketch-border-sm">
                    <button
                      type="button"
                      onClick={() => setJobCategory('fastwork_smm')}
                      className={`py-2 text-xs sm:text-sm font-extrabold font-hand rounded transition-all text-center ${
                        jobCategory === 'fastwork_smm' 
                          ? 'bg-amber-100 text-amber-900 border border-pencil shadow-sketch-sm' 
                          : 'text-pencil hover:bg-amber-50/50'
                      }`}
                    >
                      🚀 Fastwork / ปั๊มฟอล (SMM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobCategory('other_freelance')}
                      className={`py-2 text-xs sm:text-sm font-extrabold font-hand rounded transition-all text-center ${
                        jobCategory === 'other_freelance' 
                          ? 'bg-indigo-100 text-indigo-900 border border-pencil shadow-sketch-sm' 
                          : 'text-pencil hover:bg-indigo-50/50'
                      }`}
                    >
                      🎨 งานทั่วไป / พัฒนาเว็บ (อื่นๆ)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddJob} className="space-y-4">
                  {jobCategory === 'fastwork_smm' ? (
                    /* 🚀 SMM TEMPLATE FIELDS */
                    <div className="space-y-4">
                      {/* SMM Link Row */}
                      <div className="p-3 bg-amber-50/40 border border-dashed border-amber-300 rounded space-y-2">
                        <span className="text-[10px] font-bold text-amber-800 font-hand block">
                          💡 วางลิงก์ก่อนเพื่อดึงชื่อผู้ใช้และตั้งชื่อลูกค้า/ชื่องานให้อัตโนมัติ
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ลิงก์โปรไฟล์ / ลิงก์โพสต์ลูกค้า:</label>
                            <input
                              type="url"
                              value={smmLink}
                              onChange={(e) => handleSmmLinkChange(e.target.value)}
                              placeholder="วางลิงก์ IG, TikTok เพื่อดึงชื่อผู้ใช้อัตโนมัติ"
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ชื่อบัญชีลูกค้า (Handle):</label>
                            <input
                              type="text"
                              value={smmAccountName}
                              onChange={(e) => setSmmAccountName(e.target.value)}
                              placeholder="ดึงจากลิงก์ หรือพิมพ์เอง เช่น natachaseq"
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                        </div>
                      </div>

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
                          <label className="block text-xs font-bold mb-1 font-hand flex justify-between items-center">
                            <span>ช่องทางรับงาน:</span>
                            <button
                              type="button"
                              onClick={() => setShowChannelManage(true)}
                              className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5 font-bold font-hand"
                            >
                              <Tag className="w-2.5 h-2.5" /> จัดการช่องทาง
                            </button>
                          </label>
                          <CustomSelect
                            value={selectedChannelId}
                            onChange={(newChanId) => {
                              setSelectedChannelId(newChanId);
                              const services = getFormAvailableServices(newChanId);
                              if (services.length > 0) {
                                setSmmPlatform(services[0]);
                              } else {
                                setSmmPlatform('อื่นๆ');
                              }
                            }}
                            options={[
                              { value: '', label: '-- ลูกค้าโดยตรง / อื่นๆ --' },
                              ...channels.map((chan) => ({ value: chan.id, label: chan.name }))
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">บริการ SMM:</label>
                          <CustomSelect
                            value={smmPlatform}
                            onChange={(val) => setSmmPlatform(val)}
                            options={getFormAvailableServices(selectedChannelId).map((s: string) => ({ value: s, label: s }))}
                          />
                        </div>
                      </div>

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
                          <label className="block text-xs font-bold mb-1 font-hand">ลิงก์แชทคุยงาน / ID แชท Fastwork:</label>
                          <input
                            type="text"
                            value={clientChatUrl}
                            onChange={(e) => handleChatUrlChange(e.target.value)}
                            placeholder="วางลิงก์ หรือพิมพ์แค่ ID เช่น 123456"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>

                      {/* SMM Detail values */}
                      <div className="p-4 bg-control/40 sketch-border-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ประเภทผู้ติดตาม:</label>
                            <CustomSelect
                              value={smmServiceType}
                              onChange={(val) => setSmmServiceType(val)}
                              options={[
                                { value: 'ไทย', label: '🇹🇭 ไทย (Thai)' },
                                { value: 'ต่างชาติ', label: '🌎 ต่างชาติ (Foreign)' },
                                { value: 'ผสม', label: '🔄 ผสม (Mixed)' }
                              ]}
                            />
                          </div>
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
                              readOnly
                              className="w-full p-2 bg-neutral-100/50 dark:bg-neutral-800/50 border-2 border-pencil rounded-md text-sm font-hand font-extrabold cursor-not-allowed text-pencil-muted"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ลิงก์ฝั่งสั่งซื้อ (SMM):</label>
                            <input
                              type="text"
                              value={smmProviderInfo}
                              onChange={(e) => setSmmProviderInfo(e.target.value)}
                              placeholder="เช่น ลิงก์สั่งซื้อ SMMGen"
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                        </div>

                        {/* Foreign details fields */}
                        {(smmServiceType === 'ต่างชาติ' || smmServiceType === 'ผสม') && (
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
                        )}

                        {/* Thai details fields */}
                        {(smmServiceType === 'ไทย' || smmServiceType === 'ผสม') && (
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
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 🎨 GENERAL FREELANCE TEMPLATE FIELDS */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ชื่องาน / ลูกค้า:</label>
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="เช่น พัฒนาเว็บ TRC, Dashboard ขายของ"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand flex justify-between items-center">
                            <span>ช่องทางรับงาน:</span>
                            <button
                              type="button"
                              onClick={() => setShowChannelManage(true)}
                              className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5 font-bold font-hand"
                            >
                              <Tag className="w-2.5 h-2.5" /> จัดการช่องทาง
                            </button>
                          </label>
                          <CustomSelect
                            value={selectedChannelId}
                            onChange={(val) => setSelectedChannelId(val)}
                            options={[
                              { value: '', label: '-- ลูกค้าโดยตรง / อื่นๆ --' },
                              ...channels.map((chan) => ({ value: chan.id, label: chan.name }))
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ประเภทงาน / บริการ:</label>
                          <input
                            type="text"
                            value={smmPlatform}
                            onChange={(e) => setSmmPlatform(e.target.value)}
                            placeholder="เช่น แดชบอร์ดระบบ, งานดีไซน์"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          <label className="block text-xs font-bold mb-1 font-hand">ลิงก์แชทคุยงาน / ID แชท Fastwork:</label>
                          <input
                            type="text"
                            value={clientChatUrl}
                            onChange={(e) => handleChatUrlChange(e.target.value)}
                            placeholder="วางลิงก์ หรือพิมพ์แค่ ID เช่น 123456"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ความคืบหน้าของงาน (0 - 100%):</label>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={smmThaiDone}
                              onChange={(e) => setSmmThaiDone(e.target.value)}
                              className="flex-grow accent-pencil"
                            />
                            <span className="font-hand font-extrabold text-sm w-12 text-right">{smmThaiDone}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Summary Information & Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                      <label className="block text-xs font-bold mb-1 font-hand">สถานะงาน:</label>
                      <CustomSelect
                        value={jobStatus}
                        onChange={(val) => setJobStatus(val)}
                        options={[
                          { value: 'ยังไม่เริ่ม', label: '💤 ยังไม่เริ่ม (รอคิว)' },
                          { value: 'กำลังดำเนินการ', label: '⚡ กำลังดำเนินการ (กำลังทำ)' },
                          { value: 'เสร็จสิ้น', label: '✓ เสร็จสิ้น (เสร็จแล้ว)' },
                          { value: 'เสร็จสิ้นปิดงานแล้ว', label: '📁 เสร็จสิ้นปิดงานแล้ว' }
                        ]}
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

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={jobsSaving}
                      className="flex-grow sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded p-2 shadow-sketch"
                    >
                      {jobsSaving ? <span className="font-hand">กำลังบันทึก...</span> : <span className="font-hand">บันทึกข้อมูลงานลงสมุดงาน</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddJobForm(false)}
                      className="sketch-button justify-center bg-control hover:bg-control/80 text-pencil rounded p-2 px-6 font-hand"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 📊 Modal ตั้งค่า Google Sheets Webhook */}
          {showGSheetModal && (
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-paper p-6 sketch-border shadow-sketch w-full max-w-xl transform rotate-0.5 text-left space-y-4 my-8">
                <div className="flex justify-between items-center border-b-2 border-dashed border-pencil pb-2">
                  <h3 className="text-lg font-extrabold font-hand flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> ตั้งค่า Google Sheets Webhook
                  </h3>
                  <button 
                    onClick={() => setShowGSheetModal(false)}
                    className="p-1 hover:bg-control/50 rounded-full sketch-border-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-pencil-muted font-hand leading-relaxed">
                  ระบุ **Google Apps Script Webhook URL** เพื่อซิงค์ข้อมูลงานเสริมทั้งหมดไปยัง Google Sheet ของคุณโดยตรง:
                </p>

                <div>
                  <label className="block text-xs font-bold mb-1 font-hand">Webhook URL (https://script.google.com/macros/s/.../exec):</label>
                  <input
                    type="url"
                    value={webhookUrlInput}
                    onChange={(e) => setWebhookUrlInput(e.target.value)}
                    placeholder="วาง Webhook URL ที่ได้จาก Google Apps Script..."
                    className="w-full p-2.5 bg-paper text-pencil border-2 border-pencil rounded-md text-xs font-hand font-bold sketch-border-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-pencil-muted"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setGoogleSheetWebhookUrl(webhookUrlInput);
                      handleSyncGoogleSheet(webhookUrlInput);
                    }}
                    disabled={syncingSheet || !webhookUrlInput.trim()}
                    className="sketch-button bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded font-hand flex-grow justify-center"
                  >
                    {syncingSheet ? 'กำลังซิงค์...' : 'บันทึกและสั่งซิงค์ข้อมูลทันที'}
                  </button>
                  <button
                    onClick={() => setShowGSheetModal(false)}
                    className="sketch-button bg-control hover:bg-control/80 text-pencil text-xs px-4 py-2 rounded font-hand"
                  >
                    ยกเลิก
                  </button>
                </div>

                {/* Code helper snippet */}
                <div className="border-t border-dashed border-pencil pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-hand text-pencil">💡 โค้ด Google Apps Script (นำไปวางใน Sheet ของคุณ):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-hand font-bold flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'คัดลอกสำเร็จ!' : 'คัดลอกโค้ด'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-neutral-900 text-emerald-400 text-[10px] font-mono rounded max-h-40 overflow-y-auto">
                    {GOOGLE_APPS_SCRIPT_SAMPLE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Job Listing Search & Filters */}
          <div className="bg-paper p-4 sketch-border shadow-sketch transform rotate-0.5 space-y-3">
            {/* 🔍 Search Input Bar */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-pencil-muted" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 ค้นหาชื่อ IG, TikTok, FB, ชื่อลูกค้า หรือ ID คำสั่งซื้อแชท (เช่น 123456)..."
                className="w-full pl-9 pr-8 py-2 bg-paper text-pencil border-2 border-pencil rounded-md text-sm font-hand sketch-border-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-pencil-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-pencil-muted hover:text-pencil font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-control p-1 sketch-border-sm overflow-x-auto max-w-full">
                {[
                  { id: 'กำลังดำเนินการ', label: '⚡ กำลังทำ' },
                  { id: 'ยังไม่เริ่ม', label: '💤 รอคิว' },
                  { id: 'เสร็จสิ้น', label: '✓ เสร็จสิ้น' },
                  { id: 'เสร็จสิ้นปิดงานแล้ว', label: '📁 เสร็จสิ้นปิดงานแล้ว' },
                  { id: 'all', label: '📁 ทั้งหมด' }
                ].map(status => (
                  <button
                    key={status.id}
                    onClick={() => setFilterJobStatus(status.id)}
                    className={`px-3 py-1 text-xs font-bold font-hand rounded transition-colors whitespace-nowrap ${
                      filterJobStatus === status.id ? 'bg-pencil text-paper' : 'hover:bg-control/50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Dropdowns for Channel and Platform */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-hand">
                  <span className="font-bold text-pencil-muted">ช่องทาง:</span>
                  <div className="w-48">
                    <CustomSelect
                      value={filterChannelId}
                      onChange={(val) => setFilterChannelId(val)}
                      options={[
                        { value: 'all', label: '🌐 แหล่งรับงานทั้งหมด' },
                        { value: '', label: '👤 ลูกค้าตรง / ไม่ระบุ' },
                        ...channels.map(c => ({ value: c.id, label: `🏷️ ${c.name}` }))
                      ]}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-hand">
                  <span className="font-bold text-pencil-muted">บริการ SMM:</span>
                  <div className="w-48">
                    <CustomSelect
                      value={filterPlatform}
                      onChange={(val) => setFilterPlatform(val)}
                      options={[
                        { value: 'all', label: '📱 บริการทั้งหมด' },
                        ...getAvailableServices().map((s: string) => ({ value: s, label: `⚙️ ${s}` })),
                        { value: 'other', label: '🎨 งานทั่วไป / อื่นๆ' }
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
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
                  const chan = channels.find(c => c.id === job.channel_id);
                  const channelName = chan ? chan.name : 'ลูกค้าตรง / อื่นๆ';
                  
                  return (
                    <div 
                      key={job.id} 
                      className={`bg-paper p-4 sketch-border shadow-sketch transform text-left space-y-3 flex flex-col justify-between ${
                        job.status === 'เสร็จสิ้น' || job.status === 'เสร็จสิ้นปิดงานแล้ว' ? 'opacity-70 rotate-0.5' : '-rotate-0.5'
                      }`}
                    >
                      {/* Top Row: Title, Channel, Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full sketch-border-sm font-hand bg-amber-100 text-amber-800">
                            🏷️ {channelName}
                          </span>
                          <h4 className="font-extrabold text-base md:text-lg font-hand leading-tight mt-1">
                            {getCleanJobTitle(job)}
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
                            job.status === 'เสร็จสิ้น' ? 'bg-emerald-100 text-emerald-800' :
                            job.status === 'เสร็จสิ้นปิดงานแล้ว' ? 'bg-stone-200 text-pencil-muted' :
                            job.status === 'กำลังดำเนินการ' ? 'bg-sky-100 text-sky-800' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {job.status === 'เสร็จสิ้น' ? '✓ เสร็จแล้ว' :
                           job.status === 'เสร็จสิ้นปิดงานแล้ว' ? '📁 ปิดงานแล้ว' :
                           job.status === 'กำลังดำเนินการ' ? '⚡ กำลังทำ' : '💤 รอคิว'}
                        </button>
                      </div>

                      {/* Link Row */}
                      {(job.link || job.client_chat_url) && (
                        <div className="flex flex-wrap gap-2 text-xs border-t border-dashed border-pencil pt-2">
                          {job.link && (
                            <a 
                              href={job.link} 
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
                            <span>🚀 {job.platform || 'ig : ฟอล'} ({job.service_type || 'ผสม'})</span>
                            <span>เดิม: {job.start_count?.toLocaleString()} ➔ เป้าหมาย: {calculations.totalTargetFollowers?.toLocaleString()}</span>
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
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 text-[10px] font-hand">
                              <span className="text-pencil-muted font-bold">
                                ยอดจริงบน {job.platform?.toLowerCase().includes('tiktok') ? 'TikTok' : job.platform?.toLowerCase().includes('facebook') ? 'Facebook' : 'IG'} ปัจจุบัน:
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  key={`${job.id}-${(Number(job.start_count) || 0) + (Number(job.foreign_done) || 0) + (Number(job.thai_done) || 0)}`}
                                  type="number"
                                  placeholder="ระบุยอดจริง..."
                                  defaultValue={(Number(job.start_count) || 0) + (Number(job.foreign_done) || 0) + (Number(job.thai_done) || 0)}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0) {
                                      handleUpdateCurrentCount(job.id, val);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = Number((e.target as HTMLInputElement).value);
                                      if (val > 0) {
                                        handleUpdateCurrentCount(job.id, val);
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }
                                  }}
                                  className="w-20 px-1 py-0.5 text-center bg-transparent border border-pencil rounded text-[10px] font-extrabold focus:bg-control"
                                  disabled={fetchingJobIds.has(job.id)}
                                />
                                {job.link && (
                                  <button
                                    onClick={() => handleAutoFetchCount(job.id, job.link)}
                                    disabled={fetchingJobIds.has(job.id)}
                                    className={`px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-hand text-[9px] flex items-center gap-0.5 font-bold shadow-sketch-sm ${
                                      fetchingJobIds.has(job.id) ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                    title="ดึงยอดผู้ติดตามล่าสุดจากลิงก์อัตโนมัติ"
                                  >
                                    {fetchingJobIds.has(job.id) ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        <span>โหลด...</span>
                                      </>
                                    ) : (
                                      <span>🤖 ดึงยอด</span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Follower Updates (Foreign/Thai) */}
                          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-dotted border-pencil">
                            
                            {/* Foreign Follower update row */}
                            {(job.service_type === 'ต่างชาติ' || job.service_type === 'ผสม') && (Number(job.foreign_added) > 0) && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-hand text-[10px] text-pencil-muted">
                                  🌎 ต่างชาติ: +{job.foreign_done} / +{(Number(job.foreign_added) || 0) + (Number(job.foreign_gift) || 0)} (ค้าง {calculations.remainingForeign})
                                </span>
                              </div>
                            )}

                            {/* Thai Follower update row */}
                            {(job.service_type === 'ไทย' || job.service_type === 'ผสม') && (Number(job.thai_added) > 0) && (
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-hand text-[10px] text-pencil-muted">
                                  🇹🇭 ไทย: +{job.thai_done} / +{(Number(job.thai_added) || 0) + (Number(job.thai_gift) || 0)} (ค้าง {calculations.remainingThai})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* General Freelance Progress Bar (Mobile) */}
                      {!isSMM && (
                        <div className="p-3 bg-indigo-50/20 dark:bg-neutral-800/20 sketch-border-sm space-y-2 text-xs">
                          <div className="flex justify-between items-center font-hand text-[10px] text-pencil-muted">
                            <span className="font-bold">💼 {job.platform || 'งานพัฒนา/ทั่วไป'}</span>
                            <span>ความคืบหน้า: {job.thai_done || 0}%</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="w-full h-3 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
                              <div 
                                className="h-full bg-indigo-500 rounded-sm sketch-border-sm transition-all duration-300"
                                style={{ width: `${job.thai_done || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 mt-1 text-[10px] font-hand">
                            <span className="text-pencil-muted font-bold">ปรับความคืบหน้า:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={job.thai_done || 0}
                                onChange={async (e) => {
                                  const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                  const updateData = { thai_done: val };
                                  try {
                                    const { error } = await supabase
                                      .from('freelance_jobs')
                                      .update(updateData)
                                      .eq('id', job.id)
                                      .eq('user_id', userId);
                                    if (error) throw error;
                                    setJobs(jobs.map(j => j.id === job.id ? { ...j, ...updateData } : j));
                                  } catch (err) {
                                    console.error('Error updating progress percent:', err);
                                  }
                                }}
                                className="w-16 px-1.5 py-0.5 text-center bg-transparent border border-pencil rounded text-xs font-extrabold focus:bg-control"
                              />
                              <span className="font-bold text-pencil">%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Edit/Delete Actions */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-pencil">
                        <button onClick={() => startEditJob(job)} className="p-2 text-sky-600 hover:bg-sky-50 rounded"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteJob(job.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 💻 DESKTOP VIEW: FULL TABLE SCROLL CONTAINER */}
              <div className="hidden lg:block bg-paper sketch-border shadow-sketch p-4 overflow-x-auto">
                <table className="w-full border-collapse text-left font-hand text-sm min-w-[950px]">
                  <thead>
                    <tr className="border-b-2 border-pencil text-pencil-muted text-xs">
                      <th className="py-2 px-3 w-48">รายละเอียดงาน</th>
                      <th className="py-2 px-3 w-44">บริการ / ประเภทงาน</th>
                      <th className="py-2 px-3 w-56">เป้าหมาย / ขอบเขต</th>
                      <th className="py-2 px-3 w-60">ความคืบหน้า (เสร็จ/ค้าง)</th>
                      <th className="py-2 px-3 w-36">ระยะเวลา</th>
                      <th className="py-2 px-3 text-center w-36">สถานะ</th>
                      <th className="py-2 px-3 text-center w-24">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => {
                      const calculations = getJobSMMCalculations(job);
                      const isSMM = job.category === 'fastwork_smm';
                      const chan = channels.find(c => c.id === job.channel_id);
                      const channelName = chan ? chan.name : 'ลูกค้าตรง / อื่นๆ';
                      
                      return (
                        <tr 
                          key={job.id} 
                          className={`border-b border-dashed border-pencil hover:bg-control/25 transition-colors ${
                            job.status === 'เสร็จสิ้น' || job.status === 'เสร็จสิ้นปิดงานแล้ว' ? 'opacity-60 bg-control/10' : ''
                          }`}
                        >
                          {/* รายละเอียดงาน */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full sketch-border-sm bg-amber-100 text-amber-800">
                                {channelName}
                              </span>
                            </div>
                            <div className="font-extrabold text-sm">{getCleanJobTitle(job)}</div>
                            
                            <div className="flex gap-1.5 mt-1.5">
                              {job.link && (
                                <a 
                                  href={job.link} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-300 hover:bg-sky-100 text-[10px] inline-flex items-center gap-0.5 font-bold"
                                >
                                  <LinkIcon className="w-2.5 h-2.5" /> เปิดงาน
                                </a>
                              )}
                              {job.client_chat_url && (
                                <a 
                                  href={job.client_chat_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-300 hover:bg-indigo-100 text-[10px] inline-flex items-center gap-0.5 font-bold"
                                >
                                  <MessageSquare className="w-2.5 h-2.5" /> คุยงาน
                                </a>
                              )}
                            </div>
                          </td>

                          {/* บริการ SMM / ประเภทงาน */}
                          <td className="py-3 px-3 text-sm">
                            {isSMM ? (
                              <div>
                                <span className="font-extrabold block text-pencil">{job.platform}</span>
                                <span className="text-xs text-pencil-muted">({job.service_type})</span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-pencil block">{job.platform || 'งานบริการ/พัฒนาทั่วไป'}</span>
                            )}
                          </td>

                          {/* เป้าหมาย SMM / ขอบเขต */}
                          <td className="py-3 px-3 text-xs leading-relaxed">
                            {isSMM ? (
                              <div className="space-y-0.5">
                                <div>
                                  <span className="text-pencil-muted">เดิม : </span>
                                  <span className="font-bold">{job.start_count?.toLocaleString() || 0}</span>
                                </div>
                                <div>
                                  <span className="text-pencil-muted">เป้าหมาย : </span>
                                  <span className="font-bold text-pencil">{calculations.totalTargetFollowers?.toLocaleString() || 0}</span>
                                </div>
                                
                                {/* เติม row */}
                                {((job.service_type === 'ไทย' || job.service_type === 'ผสม') && Number(job.thai_added) > 0) || 
                                 ((job.service_type === 'ต่างชาติ' || job.service_type === 'ผสม') && Number(job.foreign_added) > 0) ? (
                                  <div className="flex flex-col">
                                    {/* Thai */}
                                    {(job.service_type === 'ไทย' || job.service_type === 'ผสม') && Number(job.thai_added) > 0 && (
                                      <div>
                                        <span className="text-pencil-muted">เติม : </span>
                                        <span className="font-semibold text-amber-700 dark:text-amber-400">TH {Number(job.thai_added).toLocaleString()}</span>
                                        {Number(job.thai_gift) > 0 && (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold"> +{Number(job.thai_gift).toLocaleString()}</span>
                                        )}
                                      </div>
                                    )}
                                    {/* Foreign */}
                                    {(job.service_type === 'ต่างชาติ' || job.service_type === 'ผสม') && Number(job.foreign_added) > 0 && (
                                      <div>
                                        {/* Spacer alignment if Thai was printed before */}
                                        {((job.service_type === 'ไทย' || job.service_type === 'ผสม') && Number(job.thai_added) > 0) ? (
                                          <span className="invisible text-pencil-muted">เติม : </span>
                                        ) : (
                                          <span className="text-pencil-muted">เติม : </span>
                                        )}
                                        <span className="font-semibold text-indigo-700 dark:text-indigo-400">GB {Number(job.foreign_added).toLocaleString()}</span>
                                        {Number(job.foreign_gift) > 0 && (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold"> +{Number(job.foreign_gift).toLocaleString()}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-pencil-muted text-xs">งานบริการ / ทั่วไป (ตามขอบเขต)</span>
                            )}
                          </td>

                          {/* ความคืบหน้า (เสร็จ/ค้าง) */}
                          <td className="py-3 px-3">
                            {isSMM ? (
                              <div className="space-y-1">
                                {(job.service_type === 'ต่างชาติ' || job.service_type === 'ผสม') && Number(job.foreign_added) > 0 && (
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="whitespace-nowrap">🌎 เสร็จ {job.foreign_done} (ค้าง {calculations.remainingForeign})</span>
                                  </div>
                                )}
                                {(job.service_type === 'ไทย' || job.service_type === 'ผสม') && Number(job.thai_added) > 0 && (
                                  <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="whitespace-nowrap">🇹🇭 เสร็จ {job.thai_done} (ค้าง {calculations.remainingThai})</span>
                                  </div>
                                )}
                                
                                {/* Total Progress Bar */}
                                <div className="pt-1">
                                  <div className="w-full h-2 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
                                    <div 
                                      className="h-full bg-amber-400 rounded-sm transition-all duration-300"
                                      style={{ width: `${calculations.progressPercent}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-hand">
                                  <span className="text-pencil-muted font-bold whitespace-nowrap">
                                    ยอดจริงบน {job.platform?.toLowerCase().includes('tiktok') ? 'TikTok' : job.platform?.toLowerCase().includes('facebook') ? 'Facebook' : 'IG'}:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      key={`${job.id}-${(Number(job.start_count) || 0) + (Number(job.foreign_done) || 0) + (Number(job.thai_done) || 0)}`}
                                      type="number"
                                      placeholder="ระบุยอดจริง..."
                                      defaultValue={(Number(job.start_count) || 0) + (Number(job.foreign_done) || 0) + (Number(job.thai_done) || 0)}
                                      onBlur={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) {
                                          handleUpdateCurrentCount(job.id, val);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const val = Number((e.target as HTMLInputElement).value);
                                          if (val > 0) {
                                            handleUpdateCurrentCount(job.id, val);
                                            (e.target as HTMLInputElement).blur();
                                          }
                                        }
                                      }}
                                      className="w-20 px-1 py-0.5 text-center bg-transparent border border-pencil rounded text-[10px] font-extrabold focus:bg-control"
                                      disabled={fetchingJobIds.has(job.id)}
                                    />
                                    {job.link && (
                                      <button
                                        onClick={() => handleAutoFetchCount(job.id, job.link)}
                                        disabled={fetchingJobIds.has(job.id)}
                                        className={`px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-hand text-[9px] flex items-center gap-0.5 font-bold shadow-sketch-sm ${
                                          fetchingJobIds.has(job.id) ? 'opacity-70 cursor-not-allowed' : ''
                                        }`}
                                        title="ดึงยอดผู้ติดตามล่าสุดจากลิงก์อัตโนมัติ"
                                      >
                                        {fetchingJobIds.has(job.id) ? (
                                          <>
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                            <span>โหลด...</span>
                                          </>
                                        ) : (
                                          <span>🤖 ดึงยอด</span>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-indigo-700">เสร็จ {job.thai_done || 0}%</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="pt-1">
                                  <div className="w-full h-2 bg-neutral-200/50 sketch-border-sm overflow-hidden p-0.5">
                                    <div 
                                      className="h-full bg-indigo-500 rounded-sm transition-all duration-300"
                                      style={{ width: `${job.thai_done || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-hand">
                                  <span className="text-pencil-muted font-bold whitespace-nowrap">ปรับความคืบหน้า:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={job.thai_done || 0}
                                    onChange={async (e) => {
                                      const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                      const updateData = { thai_done: val };
                                      try {
                                        const { error } = await supabase
                                          .from('freelance_jobs')
                                          .update(updateData)
                                          .eq('id', job.id)
                                          .eq('user_id', userId);
                                        if (error) throw error;
                                        setJobs(jobs.map(j => j.id === job.id ? { ...j, ...updateData } : j));
                                      } catch (err) {
                                        console.error('Error updating progress percent:', err);
                                      }
                                    }}
                                    className="w-16 px-1 py-0.5 text-center bg-transparent border border-pencil rounded text-[10px] font-extrabold focus:bg-control"
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* ระยะเวลา */}
                          <td className="py-3 px-3 text-xs text-pencil-muted">
                            <div>เริ่ม: {new Date(job.start_date).toLocaleDateString('th-TH')}</div>
                            <div>
                              {job.end_date 
                                ? `เสร็จ: ${new Date(job.end_date).toLocaleDateString('th-TH')}` 
                                : `ทำมาแล้ว ${calculations.daysSpent} วัน`}
                            </div>
                          </td>

                          {/* สถานะ */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleJobStatus(job.id, job.status)}
                              className={`px-3 py-1 rounded-md border-2 border-pencil font-hand text-xs font-bold transition-all shadow-sketch-sm ${
                                job.status === 'เสร็จสิ้น' ? 'bg-emerald-100 text-emerald-800' :
                                job.status === 'เสร็จสิ้นปิดงานแล้ว' ? 'bg-stone-200 text-pencil-muted' :
                                job.status === 'กำลังดำเนินการ' ? 'bg-sky-100 text-sky-800' : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {job.status === 'เสร็จสิ้น' ? 'เสร็จสิ้น ✓' :
                               job.status === 'เสร็จสิ้นปิดงานแล้ว' ? 'ปิดงานแล้ว 📁' :
                               job.status === 'กำลังดำเนินการ' ? 'กำลังทำ ⚡' : 'รอคิว 💤'}
                            </button>
                          </td>

                          {/* จัดการ */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => startEditJob(job)}
                                className="p-1 text-sky-600 hover:bg-sky-50 rounded"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 🏷️ Modal จัดการช่องทางรับงาน */}
          {showChannelManage && (
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-paper p-6 sketch-border shadow-sketch w-full max-w-md transform rotate-0.5 text-left space-y-4">
                <div className="flex justify-between items-center border-b-2 border-dashed border-pencil pb-2">
                  <h3 className="text-lg font-extrabold font-hand flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-500" /> จัดการช่องทางรับงาน
                  </h3>
                  <button 
                    onClick={() => setShowChannelManage(false)}
                    className="p-1 hover:bg-control/50 rounded-full sketch-border-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form to Add Channel */}
                <form onSubmit={handleAddChannel} className="flex gap-2">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="ชื่อช่องทางใหม่ เช่น SMMGen, TikTok Shop"
                    className="flex-grow p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                    required
                  />
                  <button
                    type="submit"
                    disabled={channelSaving}
                    className="sketch-button bg-pencil hover:bg-neutral-800 text-white rounded px-4 text-sm font-hand"
                  >
                    {channelSaving ? '...' : 'เพิ่ม'}
                  </button>
                </form>

                {/* List of Channels */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {channelsLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-pencil-muted" /></div>
                  ) : channels.length === 0 ? (
                    <p className="text-xs text-pencil-muted text-center font-hand">ยังไม่มีช่องทางรับงาน ☕</p>
                  ) : (
                    channels.map((chan) => (
                      <div key={chan.id} className="flex justify-between items-center p-2 bg-control/40 sketch-border-sm">
                        <span className="font-hand font-bold text-sm">{chan.name}</span>
                        <button
                          onClick={() => handleDeleteChannel(chan.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-right border-t border-dashed border-pencil pt-3">
                  <button
                    onClick={() => setShowChannelManage(false)}
                    className="sketch-button bg-control hover:bg-control/80 text-pencil rounded px-4 py-1 text-xs font-hand"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📝 Modal แก้ไขข้อมูลงานเสริม */}
          {editingJob && (
            <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-paper p-6 sketch-border shadow-sketch w-full max-w-3xl transform rotate-0.5 text-left space-y-4 my-8">
                <div className="flex justify-between items-center border-b-2 border-dashed border-pencil pb-2">
                  <h3 className="text-lg font-extrabold font-hand flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" /> แก้ไขรายละเอียดใบงาน
                  </h3>
                  <button 
                    onClick={() => setEditingJob(null)}
                    className="p-1 hover:bg-control/50 rounded-full sketch-border-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateJob} className="space-y-4">
                  {/* 1. Category Template Switcher at the very top of Edit Modal */}
                  <div className="mb-4">
                    <label className="block text-xs font-bold mb-1.5 font-hand text-pencil-muted">กรุณาเลือกรูปแบบเทมเพลตงาน:</label>
                    <div className="grid grid-cols-2 gap-2 bg-control/30 p-1 sketch-border-sm">
                      <button
                        type="button"
                        onClick={() => setJobCategory('fastwork_smm')}
                        className={`py-2 text-xs sm:text-sm font-extrabold font-hand rounded transition-all text-center ${
                          jobCategory === 'fastwork_smm' 
                            ? 'bg-amber-100 text-amber-900 border border-pencil shadow-sketch-sm' 
                            : 'text-pencil hover:bg-amber-50/50'
                        }`}
                      >
                        🚀 Fastwork / ปั๊มฟอล (SMM)
                      </button>
                      <button
                        type="button"
                        onClick={() => setJobCategory('other_freelance')}
                        className={`py-2 text-xs sm:text-sm font-extrabold font-hand rounded transition-all text-center ${
                          jobCategory === 'other_freelance' 
                            ? 'bg-indigo-100 text-indigo-900 border border-pencil shadow-sketch-sm' 
                            : 'text-pencil hover:bg-indigo-50/50'
                        }`}
                      >
                        🎨 งานทั่วไป / พัฒนาเว็บ (อื่นๆ)
                      </button>
                    </div>
                  </div>

                  {jobCategory === 'fastwork_smm' ? (
                    /* 🚀 SMM TEMPLATE FIELDS */
                    <div className="space-y-4">
                      {/* SMM Link Row (Auto Extract) */}
                      <div className="p-3 bg-amber-50/40 border border-dashed border-amber-300 rounded space-y-2">
                        <span className="text-[10px] font-bold text-amber-800 font-hand block">
                          💡 วางลิงก์ก่อนเพื่อดึงชื่อผู้ใช้และตั้งชื่อลูกค้า/ชื่องานให้อัตโนมัติ
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ลิงก์โปรไฟล์ / ลิงก์โพสต์ลูกค้า:</label>
                            <input
                              type="url"
                              value={smmLink}
                              onChange={(e) => handleSmmLinkChange(e.target.value)}
                              placeholder="วางลิงก์ IG, TikTok เพื่อดึงชื่อผู้ใช้อัตโนมัติ"
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ชื่อบัญชีลูกค้า (Handle):</label>
                            <input
                              type="text"
                              value={smmAccountName}
                              onChange={(e) => setSmmAccountName(e.target.value)}
                              placeholder="ดึงจากลิงก์ หรือพิมพ์เอง เช่น natachaseq"
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                        </div>
                      </div>

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
                          <label className="block text-xs font-bold mb-1 font-hand flex justify-between items-center">
                            <span>ช่องทางรับงาน:</span>
                            <button
                              type="button"
                              onClick={() => setShowChannelManage(true)}
                              className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5 font-bold font-hand"
                            >
                              <Tag className="w-2.5 h-2.5" /> จัดการช่องทาง
                            </button>
                          </label>
                          <CustomSelect
                            value={selectedChannelId}
                            onChange={(newChanId) => {
                              setSelectedChannelId(newChanId);
                              const services = getFormAvailableServices(newChanId);
                              if (services.length > 0) {
                                setSmmPlatform(services[0]);
                              } else {
                                setSmmPlatform('อื่นๆ');
                              }
                            }}
                            options={[
                              { value: '', label: '-- ลูกค้าโดยตรง / อื่นๆ --' },
                              ...channels.map((chan) => ({ value: chan.id, label: chan.name }))
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">บริการ SMM:</label>
                          <CustomSelect
                            value={smmPlatform}
                            onChange={(val) => setSmmPlatform(val)}
                            options={getFormAvailableServices(selectedChannelId).map((s: string) => ({ value: s, label: s }))}
                          />
                        </div>
                      </div>

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
                          <label className="block text-xs font-bold mb-1 font-hand">ลิงก์แชทคุยงาน / ID แชท Fastwork:</label>
                          <input
                            type="text"
                            value={clientChatUrl}
                            onChange={(e) => handleChatUrlChange(e.target.value)}
                            placeholder="วางลิงก์ หรือพิมพ์แค่ ID เช่น 123456"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>

                      {/* SMM Detail values */}
                      <div className="p-4 bg-control/40 sketch-border-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ประเภทผู้ติดตาม:</label>
                            <CustomSelect
                              value={smmServiceType}
                              onChange={(val) => setSmmServiceType(val)}
                              options={[
                                { value: 'ไทย', label: '🇹🇭 ไทย (Thai)' },
                                { value: 'ต่างชาติ', label: '🌎 ต่างชาติ (Foreign)' },
                                { value: 'ผสม', label: '🔄 ผสม (Mixed)' }
                              ]}
                            />
                          </div>
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
                              readOnly
                              className="w-full p-2 bg-neutral-100/50 dark:bg-neutral-800/50 border-2 border-pencil rounded-md text-sm font-hand font-extrabold cursor-not-allowed text-pencil-muted"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand">ลิงก์ฝั่งสั่งซื้อ (SMM / ผู้รับงาน):</label>
                            <input
                              type="text"
                              value={smmProviderInfo}
                              onChange={(e) => setSmmProviderInfo(e.target.value)}
                              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            />
                          </div>
                        </div>

                        {/* IG Current Count Calculator */}
                        <div className="bg-indigo-50/50 p-3 rounded border border-indigo-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div>
                            <label className="block text-xs font-bold mb-1 font-hand text-indigo-700">คำนวณยอดทำเสร็จจาก IG ปัจจุบัน:</label>
                            <input
                              type="number"
                              value={tempCurrentCount}
                              placeholder="ระบุยอดติดตามปัจจุบันบน IG..."
                              onChange={(e) => {
                                const valStr = e.target.value;
                                setTempCurrentCount(valStr);
                                const currentVal = Number(valStr) || 0;
                                const start = Number(smmStartCount) || 0;
                                const totalDone = Math.max(0, currentVal - start);
                                
                                if (smmServiceType === 'ไทย') {
                                  setSmmThaiDone(String(totalDone));
                                } else if (smmServiceType === 'ต่างชาติ') {
                                  setSmmForeignDone(String(totalDone));
                                } else {
                                  const foreignTarget = (Number(smmForeignAdded) || 0) + (Number(smmForeignGift) || 0);
                                  const foreignDone = Math.min(foreignTarget, totalDone);
                                  const thaiDone = Math.max(0, totalDone - foreignDone);
                                  setSmmForeignDone(String(foreignDone));
                                  setSmmThaiDone(String(thaiDone));
                                }
                              }}
                              className="w-full p-2 bg-transparent border-2 border-indigo-400 rounded-md text-sm font-hand font-extrabold text-indigo-900 focus:border-indigo-600 focus:outline-none"
                            />
                          </div>
                          <div className="text-[11px] text-indigo-700/80 font-hand space-y-0.5">
                            <p className="font-bold">💡 ตัวช่วยคำนวณอัตโนมัติ:</p>
                            <p>เมื่อใส่ตัวเลขนี้ ระบบจะเอาไปลบกับ <strong>ยอดเริ่ม ({smmStartCount})</strong> ได้ยอดทำเสร็จ <strong>{Math.max(0, (Number(tempCurrentCount) || 0) - (Number(smmStartCount) || 0))}</strong> คน และจะเอาไปตั้งค่าเป็นยอดทำไปแล้วให้เองทันทีตามประเภทบริการครับ</p>
                          </div>
                        </div>

                        {/* Foreign details fields */}
                        {(smmServiceType === 'ต่างชาติ' || smmServiceType === 'ผสม') && (
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
                        )}

                        {/* Thai details fields */}
                        {(smmServiceType === 'ไทย' || smmServiceType === 'ผสม') && (
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
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 🎨 GENERAL FREELANCE TEMPLATE FIELDS */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ชื่องาน / ลูกค้า:</label>
                          <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="เช่น พัฒนาเว็บ TRC, Dashboard ขายของ"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand flex justify-between items-center">
                            <span>ช่องทางรับงาน:</span>
                            <button
                              type="button"
                              onClick={() => setShowChannelManage(true)}
                              className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5 font-bold font-hand"
                            >
                              <Tag className="w-2.5 h-2.5" /> จัดการช่องทาง
                            </button>
                          </label>
                          <CustomSelect
                            value={selectedChannelId}
                            onChange={(val) => setSelectedChannelId(val)}
                            options={[
                              { value: '', label: '-- ลูกค้าโดยตรง / อื่นๆ --' },
                              ...channels.map((chan) => ({ value: chan.id, label: chan.name }))
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ประเภทงาน / บริการ (เช่น เขียนโค้ด, แดชบอร์ด):</label>
                          <input
                            type="text"
                            value={smmPlatform}
                            onChange={(e) => setSmmPlatform(e.target.value)}
                            placeholder="เช่น แดชบอร์ดระบบ, เขียนโปรแกรม Backend, งานดีไซน์"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          <label className="block text-xs font-bold mb-1 font-hand">ลิงก์แชทคุยงาน / ID แชท Fastwork:</label>
                          <input
                            type="text"
                            value={clientChatUrl}
                            onChange={(e) => handleChatUrlChange(e.target.value)}
                            placeholder="วางลิงก์ หรือพิมพ์แค่ ID เช่น 123456"
                            className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1 font-hand">ความคืบหน้าของงาน (0 - 100%):</label>
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={smmThaiDone}
                              onChange={(e) => setSmmThaiDone(e.target.value)}
                              className="flex-grow accent-pencil"
                            />
                            <span className="font-hand font-extrabold text-sm w-12 text-right">{smmThaiDone}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Summary Information & Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                      <label className="block text-xs font-bold mb-1 font-hand">สถานะงาน:</label>
                      <CustomSelect
                        value={jobStatus}
                        onChange={(val) => setJobStatus(val)}
                        options={[
                          { value: 'ยังไม่เริ่ม', label: '💤 ยังไม่เริ่ม (รอคิว)' },
                          { value: 'กำลังดำเนินการ', label: '⚡ กำลังดำเนินการ (กำลังทำ)' },
                          { value: 'เสร็จสิ้น', label: '✓ เสร็จสิ้น (เสร็จแล้ว)' },
                          { value: 'เสร็จสิ้นปิดงานแล้ว', label: '📁 เสร็จสิ้นปิดงานแล้ว' }
                        ]}
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
                      className="w-full p-2 bg-transparent border-2 border-pencil rounded-md text-sm font-hand"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={jobsSaving}
                      className="flex-grow sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded p-2 shadow-sketch"
                    >
                      {jobsSaving ? <span className="font-hand">กำลังเซฟ...</span> : <span className="font-hand">บันทึกการแก้ไข</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingJob(null)}
                      className="sketch-button justify-center bg-control hover:bg-control/80 text-pencil rounded p-2 px-6"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
