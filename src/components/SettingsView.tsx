import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, LogOut, Sun, Moon, Info, ShieldAlert, BookOpen,
  Briefcase, Plus, Trash2, Tag, FileSpreadsheet, Copy, Check
} from 'lucide-react';
import { 
  getGoogleSheetWebhookUrl, 
  setGoogleSheetWebhookUrl, 
  GOOGLE_APPS_SCRIPT_SAMPLE 
} from '../lib/googleSheetSync';

interface SettingsViewProps {
  userId: string;
  onSignOut: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userId, onSignOut }) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return document.body.classList.contains('dark-mode');
  });

  // Channels & Services management states
  const [channels, setChannels] = useState<any[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Google Sheets Webhook States
  const [webhookUrl, setWebhookUrlState] = useState<string>(() => getGoogleSheetWebhookUrl());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setProfile({
            email: user.email,
            fullName: user.user_metadata?.full_name || 'ผู้ใช้งานระบบ',
            createdAt: new Date(user.created_at).toLocaleDateString('th-TH')
          });
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const fetchChannels = async () => {
    try {
      setChannelsLoading(true);
      const { data, error } = await supabase
        .from('freelance_channels')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      if (error) throw error;
      
      const loadedChannels = data || [];
      setChannels(loadedChannels);
      
      if (loadedChannels.length > 0) {
        setSelectedChannelId(prev => {
          if (prev && loadedChannels.some(c => c.id === prev)) {
            return prev;
          }
          return loadedChannels[0].id;
        });
      } else {
        setSelectedChannelId('');
      }
    } catch (err) {
      console.error('Error loading channels in settings:', err);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [userId]);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    if (!window.confirm('คุณต้องการออกจากระบบสมุดบันทึกใช่หรือไม่?')) return;
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('freelance_channels')
        .insert({
          user_id: userId,
          name: newChannelName.trim(),
          services: ['ig : ฟอล', 'ig : ไลค์', 'tiktok : ตต', 'facebook : ตต', 'อื่นๆ']
        })
        .select();
      if (error) throw error;
      setNewChannelName('');
      await fetchChannels();
      if (data && data.length > 0) {
        setSelectedChannelId(data[0].id);
      }
    } catch (err) {
      console.error('Error adding channel:', err);
      alert('เกิดข้อผิดพลาดในการเพิ่มช่องทาง');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    const channel = channels.find(c => c.id === id);
    if (!channel) return;
    if (!window.confirm(`คุณต้องการลบช่องทาง "${channel.name}" ใช่หรือไม่? งานที่ผูกกับช่องทางนี้จะไม่ถูกลบ`)) return;
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('freelance_channels')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      await fetchChannels();
    } catch (err) {
      console.error('Error deleting channel:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !newServiceName.trim()) return;
    
    const channel = channels.find(c => c.id === selectedChannelId);
    if (!channel) return;
    
    const currentServices = channel.services || [];
    if (currentServices.includes(newServiceName.trim())) {
      alert('บริการนี้มีอยู่แล้วในช่องทางนี้');
      return;
    }
    
    const updatedServices = [...currentServices, newServiceName.trim()];
    
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('freelance_channels')
        .update({ services: updatedServices })
        .eq('id', selectedChannelId)
        .eq('user_id', userId);
      if (error) throw error;
      setNewServiceName('');
      await fetchChannels();
    } catch (err) {
      console.error('Error adding service:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteService = async (serviceIndex: number) => {
    if (!selectedChannelId) return;
    
    const channel = channels.find(c => c.id === selectedChannelId);
    if (!channel) return;
    
    const currentServices = channel.services || [];
    const updatedServices = currentServices.filter((_: any, idx: number) => idx !== serviceIndex);
    
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('freelance_channels')
        .update({ services: updatedServices })
        .eq('id', selectedChannelId)
        .eq('user_id', userId);
      if (error) throw error;
      await fetchChannels();
    } catch (err) {
      console.error('Error deleting service:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5">
        <h2 className="text-xl md:text-2xl font-extrabold font-hand flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
          การตั้งค่า & โปรไฟล์ส่วนตัว
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* User profile details */}
        <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 space-y-4">
          <h3 className="text-xl font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            ข้อมูลผู้บันทึก
          </h3>

          {loading ? (
            <p className="font-hand text-sm text-pencil-muted">กำลังโหลดข้อมูลผู้ใช้...</p>
          ) : profile ? (
            <div className="space-y-3 font-hand">
              <div>
                <span className="text-xs text-pencil-muted">ชื่อผู้ใช้:</span>
                <p className="text-lg font-bold">{profile.fullName}</p>
              </div>
              <div>
                <span className="text-xs text-pencil-muted">อีเมลเข้าใช้งาน:</span>
                <p className="text-base font-bold">{profile.email}</p>
              </div>
              <div>
                <span className="text-xs text-pencil-muted">เริ่มจดบันทึกเมื่อ:</span>
                <p className="text-sm font-bold">{profile.createdAt}</p>
              </div>
            </div>
          ) : (
            <p className="font-hand text-sm text-red-500">ไม่พบข้อมูลโปรไฟล์</p>
          )}

          <div className="notebook-divider"></div>

          {/* Theme switcher */}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold font-hand">โหมดการแสดงผล (Theme):</span>
            <button
              onClick={toggleDarkMode}
              className="sketch-button bg-control text-xs rounded sketch-border-sm shadow-sketch-sm"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-hand">เปิดโหมดกลางวัน (Light Mode)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="font-hand">เปิดโหมดกลางคืน (Dark Mode)</span>
                </>
              )}
            </button>
          </div>

          <div className="notebook-divider"></div>

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full sketch-button justify-center bg-red-50 text-red-700 hover:bg-red-100 rounded p-2 sketch-border shadow-sketch"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-hand">ปิดสมุด (ออกจากระบบ)</span>
          </button>
        </div>

        {/* Security & Private Guide Card */}
        <div className="bg-paper p-6 sketch-border shadow-sketch transform -rotate-0.5 space-y-4">
          <h3 className="text-xl font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 flex items-center gap-2 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
            ข้อแนะนำการใช้งานคนเดียว (Single User)
          </h3>

          <div className="space-y-4 font-hand text-sm leading-relaxed">
            <p>
              เนื่องจากแอปพลิเคชันนี้ออกแบบมาให้คุณใช้งานเพียงคนเดียวบนฐานข้อมูลของคุณเอง และมีการเปิดตัวเว็บบนระบบ **Vercel** ให้ผู้อื่นสามารถกดเข้ามาดูได้
            </p>

            <div className="p-3 bg-amber-50 sketch-border-sm space-y-2">
              <span className="font-bold text-amber-800 flex items-center gap-1">
                🔒 ขั้นตอนปิดรับผู้ใช้ใหม่:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 text-xs text-amber-950 leading-relaxed">
                <li>เข้าไปยังหน้าแดชบอร์ดของ <a href="https://supabase.com" target="_blank" className="underline font-bold" rel="noreferrer">Supabase Console</a></li>
                <li>เลือกโปรเจกต์ของคุณชื่อ <span className="font-bold">work_life_cycle</span></li>
                <li>ไปที่เมนู **Authentication** ด้านซ้ายมือ</li>
                <li>คลิกเลือกหัวข้อ **Providers** จากแถบเมนูด้านบน</li>
                <li>เลือกกล่องตัวเลือก **Email**</li>
                <li>เลื่อนหาหัวข้อ **Allow new users to sign up** แล้วกด <span className="font-bold text-red-500">ติ๊กปิดสวิตช์</span></li>
                <li>กดปุ่ม **Save** หรือ **บันทึก**</li>
              </ol>
            </div>

            <div className="flex items-start gap-2 p-2 bg-blue-50/50 sketch-border-sm text-xs text-neutral-600">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <div>
                เมื่อตั้งค่าแล้ว จะไม่มีใครสามารถสมัครสมาชิกผ่านหน้าจอแอปนี้ได้อีก และข้อมูลของคุณทั้งหมดในฐานข้อมูลจะมีความปลอดภัยสูงสุด มีแต่คุณเท่านั้นที่สามารถ Login เข้ามาจดบันทึกได้ครับ
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Google Sheets Webhook Configuration Card */}
        <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 space-y-4 md:col-span-2">
          <h3 className="text-xl font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            ตั้งค่าการซิงค์ข้อมูลกับ Google Sheet (Google Apps Script Webhook)
          </h3>

          <div className="space-y-4 font-hand text-sm leading-relaxed">
            <p className="text-xs text-pencil-muted">
              นำ **Google Apps Script Webhook URL** จาก Google Sheet ของคุณมาวางที่นี่ เพื่อให้ปุ่ม "ซิงค์ไป Google Sheet" ส่งข้อมูลงานเสริมทั้งหมดไปอัปเดตบนตารางชีทให้อัตโนมัติทันที
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrlState(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-grow p-2.5 bg-paper text-pencil border-2 border-pencil rounded-md text-xs font-hand font-bold sketch-border-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-pencil-muted"
              />
              <button
                onClick={() => {
                  setGoogleSheetWebhookUrl(webhookUrl);
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2500);
                }}
                className="sketch-button bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded text-xs font-hand font-bold shadow-sketch-sm justify-center whitespace-nowrap"
              >
                {savedSuccess ? '✓ บันทึกสำเร็จ!' : 'บันทึก Webhook URL'}
              </button>
            </div>

            {/* Google Apps Script instructions & Copy Code */}
            <div className="p-4 bg-emerald-50/50 dark:bg-neutral-800/60 sketch-border-sm space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-dashed border-emerald-300 pb-2">
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200">
                  📜 โค้ด Google Apps Script (สำหรับวางใน Google Sheet):
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded sketch-border-sm font-hand font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'คัดลอกสำเร็จ!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-emerald-950 dark:text-emerald-300 leading-relaxed">
                <li>เปิด Google Sheet ของคุณ ➔ เมนู <strong>ส่วนขยาย (Extensions)</strong> ➔ <strong>Apps Script</strong></li>
                <li>ลบโค้ดเดิมทั้งหมด แล้วกดวางโค้ดที่คัดลอกจากปุ่มด้านบนนี้ลงไป</li>
                <li>กดปุ่ม <strong>ทำให้ใช้งานได้อย่างเป็นทางการ (Deploy)</strong> ➔ <strong>การทำรายการจัดส่งใหม่ (New deployment)</strong></li>
                <li>เลือกประเภท <strong>แอปเว็บ (Web app)</strong> ➔ ตั้งค่า <em>"ผู้มีสิทธิ์เข้าถึง (Who has access)"</em> เป็น <strong>ทุกคน (Anyone)</strong></li>
                <li>กด Deploy แล้วคัดลอก <strong>URL ของแอปเว็บ (Web app URL)</strong> มาวางในช่องด้านบนนี้ แล้วกดบันทึกครับ!</li>
              </ol>

              <pre className="p-3 bg-neutral-900 text-emerald-400 text-[10px] font-mono rounded max-h-44 overflow-y-auto mt-2">
                {GOOGLE_APPS_SCRIPT_SAMPLE}
              </pre>
            </div>
          </div>
        </div>

        {/* Manage Channels and Services Card */}
        <div className="bg-paper p-6 sketch-border shadow-sketch transform rotate-0.5 space-y-6 md:col-span-2">
          <h3 className="text-xl font-extrabold font-hand border-b border-dashed border-neutral-300 pb-2 flex items-center gap-2 text-indigo-600">
            <Briefcase className="w-5 h-5" />
            จัดการช่องทาง & บริการงานเสริม SMM
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Channels Column */}
            <div className="md:col-span-2 space-y-4 border-r border-dashed border-neutral-300 pr-0 md:pr-6">
              <h4 className="font-hand font-bold text-sm text-pencil-muted flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> 1. เลือก / เพิ่มช่องทางรับงาน
              </h4>
              
              {channelsLoading ? (
                <p className="font-hand text-xs text-pencil-muted">กำลังโหลดช่องทาง...</p>
              ) : channels.length === 0 ? (
                <p className="font-hand text-xs text-red-500">ยังไม่มีช่องทางรับงาน</p>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {channels.map(c => {
                    const isSelected = c.id === selectedChannelId;
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedChannelId(c.id)}
                        className={`flex items-center justify-between p-2 rounded-md font-hand text-sm cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-pencil text-white font-bold shadow-sketch-sm' 
                            : 'bg-control/50 hover:bg-control hover:text-pencil'
                        }`}
                      >
                        <span className="truncate">🏷️ {c.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChannel(c.id);
                          }}
                          className={`p-1 hover:text-red-500 transition-colors ${
                            isSelected ? 'text-neutral-300' : 'text-neutral-400'
                          }`}
                          title="ลบช่องทาง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleAddChannel} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="เช่น Fastwork, Line"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="flex-grow p-1.5 bg-transparent border-2 border-pencil rounded-md text-xs font-hand"
                  disabled={updating}
                  required
                />
                <button
                  type="submit"
                  disabled={updating}
                  className="sketch-button bg-pencil text-white text-xs px-3 rounded sketch-border-sm shadow-sketch-sm font-hand"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่ม
                </button>
              </form>
            </div>

            {/* Services Column */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-hand font-bold text-sm text-pencil-muted flex items-center gap-1.5">
                ⚡ 2. ตั้งค่าบริการ SMM ของช่องทาง: {channels.find(c => c.id === selectedChannelId)?.name || '-'}
              </h4>

              {selectedChannelId ? (
                <div className="space-y-4">
                  {/* Services list */}
                  <div className="flex flex-wrap gap-2 min-h-[100px] p-3 bg-control/30 sketch-border-sm">
                    {(() => {
                      const selChan = channels.find(c => c.id === selectedChannelId);
                      const servicesList = selChan?.services || [];
                      if (servicesList.length === 0) {
                        return <p className="font-hand text-xs text-pencil-muted m-auto">ยังไม่มีการเพิ่มประเภทบริการ</p>;
                      }
                      return servicesList.map((s: string, idx: number) => (
                        <span 
                          key={`${s}-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 text-xs font-bold font-hand sketch-border-sm animate-fade-in"
                        >
                          {s}
                          <button
                            onClick={() => handleDeleteService(idx)}
                            className="text-neutral-400 hover:text-red-500 ml-0.5"
                            title="ลบประเภทบริการนี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ));
                    })()}
                  </div>

                  <form onSubmit={handleAddService} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น ig : ฟอลต่างชาติ, tiktok : ไลค์"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="flex-grow p-1.5 bg-transparent border-2 border-pencil rounded-md text-xs font-hand"
                      disabled={updating}
                      required
                    />
                    <button
                      type="submit"
                      disabled={updating}
                      className="sketch-button bg-pencil text-white text-xs px-3 rounded sketch-border-sm shadow-sketch-sm font-hand"
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มบริการ
                    </button>
                  </form>
                </div>
              ) : (
                <p className="font-hand text-xs text-pencil-muted text-center py-10">
                  กรุณาเลือกหรือเพิ่มช่องทางรับงานทางด้านซ้ายเพื่อตั้งค่าบริการ SMM
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
