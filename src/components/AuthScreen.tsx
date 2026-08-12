import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BookOpen, LogIn, UserPlus, Info } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage('สมัครสมาชิกสำเร็จ! ตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตน (หรือเข้าสู่ระบบได้ทันทีหากระบบข้ามขั้นตอนการยืนยัน)');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-screen w-full flex items-center justify-center p-4 notebook-grid min-h-screen">
      <div className="w-full max-w-md bg-paper p-8 sketch-border-lg shadow-sketch relative">
        {/* Notebook decorative binding rings */}
        <div className="absolute -top-3 left-10 right-10 flex justify-between px-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-4 h-8 bg-neutral-400 rounded-full border-2 border-neutral-700 shadow-sm transform -rotate-12"></div>
          ))}
        </div>

        <div className="text-center mt-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 sketch-border-sm bg-amber-100 mb-3 transform -rotate-3">
            <BookOpen className="w-10 h-10 text-neutral-800" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mt-2 font-hand highlight-scribble inline-block">
            LifeCycle
          </h1>
          <p className="text-sm text-pencil-muted mt-2 font-hand">
            สมุดจดชีวิตประจำวันและการเงินส่วนตัว
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-50 text-red-700 sketch-border-sm text-sm font-medium transform rotate-0.5">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="p-3 mb-6 bg-emerald-50 text-emerald-800 sketch-border-sm text-sm font-medium transform -rotate-0.5">
            ✨ {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-bold mb-1 font-hand">ชื่อ-นามสกุล (จดลงสมุด):</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                className="w-full p-2 bg-transparent border-2 border-pencil rounded-md focus:outline-none focus:ring-1 focus:ring-pencil shadow-inner text-sm font-hand"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-1 font-hand">อีเมลผู้ใช้งาน:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md focus:outline-none focus:ring-1 focus:ring-pencil shadow-inner text-sm font-hand"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 font-hand">รหัสผ่าน:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 bg-transparent border-2 border-pencil rounded-md focus:outline-none focus:ring-1 focus:ring-pencil shadow-inner text-sm font-hand"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 sketch-button justify-center bg-pencil hover:bg-neutral-800 text-white rounded-md p-2 shadow-sketch transition-all duration-100"
          >
            {loading ? (
              <span className="font-hand">กำลังบันทึก...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="font-hand">สมัครสมาชิก (จดประวัติใหม่)</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span className="font-hand">เปิดสมุดบันทึก (เข้าสู่ระบบ)</span>
              </>
            )}
          </button>
        </form>

        <div className="notebook-divider my-6"></div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-sm font-bold underline hover:text-neutral-600 font-hand"
          >
            {isSignUp ? 'มีสมุดบันทึกอยู่แล้ว? เข้าสู่ระบบที่นี่' : 'เพิ่งมาครั้งแรก? สมัครสมาชิกใหม่ที่นี่'}
          </button>
        </div>

        <div className="mt-8 p-3 bg-blue-50/50 sketch-border-sm text-xs text-neutral-600 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
          <div className="font-hand leading-relaxed">
            <span className="font-bold">ข้อมูลการใช้งานคนเดียว:</span> หลังจากที่คุณสมัครสมาชิกครั้งแรกเรียบร้อยแล้ว แนะนำให้ทำการปิดรับสมาชิกใหม่ (Disable Public Signup) ที่หน้าแดชบอร์ด Supabase เพื่อความปลอดภัยสูงสุดครับ
          </div>
        </div>
      </div>
    </div>
  );
};
