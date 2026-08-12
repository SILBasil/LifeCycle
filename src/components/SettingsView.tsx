import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, LogOut, Sun, Moon, Info, ShieldAlert, BookOpen } from 'lucide-react';

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
                <li>เข้าไปยังหน้าแดชบอร์ดของ <a href="https://supabase.com" target="_blank" className="underline font-bold">Supabase Console</a></li>
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

      </div>
    </div>
  );
};
