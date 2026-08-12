import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { ExpensesView } from './components/ExpensesView';
import { SettingsView } from './components/SettingsView';

import { 
  BookOpen, 
  Home, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  DollarSign, 
  Settings, 
  User,
  Loader2
} from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Dashboard');

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const handleAuthSuccess = () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  };

  const handleSignOut = () => {
    setSession(null);
    setActiveTab('Dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-paper notebook-grid">
        <Loader2 className="w-12 h-12 animate-spin text-neutral-800" />
        <p className="font-hand text-xl mt-4 font-bold text-pencil">กำลังเปิดสมุด LifeCycle...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const userFullName = session.user.user_metadata?.full_name || 'คุณ';

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard userId={session.user.id} onNavigate={setActiveTab} />;
      case 'Calendar':
        return <CalendarView userId={session.user.id} />;
      case 'Tasks':
        return <TasksView userId={session.user.id} />;
      case 'Expenses':
        return <ExpensesView userId={session.user.id} />;
      case 'Settings':
        return <SettingsView userId={session.user.id} onSignOut={handleSignOut} />;
      default:
        return <Dashboard userId={session.user.id} onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'Dashboard', label: 'หน้าแรก', icon: Home },
    { id: 'Calendar', label: 'ปฏิทิน', icon: CalendarIcon },
    { id: 'Tasks', label: 'บันทึกงาน', icon: CheckSquare },
    { id: 'Expenses', label: 'การเงิน', icon: DollarSign },
    { id: 'Settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-paper notebook-grid transition-colors duration-300">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-pencil dark:border-pencil-dark p-6 bg-paper relative">
        {/* Notebook Spiral Binding Rings */}
        <div className="absolute top-0 right-[-10px] bottom-0 flex flex-col justify-between py-10 z-10">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-5 h-5 bg-neutral-400 dark:bg-neutral-600 rounded-full border-2 border-neutral-700 shadow-sm transform -rotate-12 my-2"></div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 sketch-border-sm bg-amber-100 dark:bg-neutral-800 transform -rotate-3">
            <BookOpen className="w-6 h-6 text-neutral-800 dark:text-neutral-100" />
          </div>
          <span className="text-2xl font-extrabold font-hand tracking-tight highlight-scribble">LifeCycle</span>
        </div>

        {/* User Card */}
        <div className="mb-8 p-3 bg-control/50 sketch-border-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-sm font-hand">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="text-xs text-pencil-muted font-hand block">สวัสดี</span>
            <span className="font-hand font-extrabold text-sm truncate block">{userFullName}</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-grow space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md font-hand text-left transition-all ${
                  isActive 
                    ? 'sketch-button bg-pencil text-white dark:bg-pencil-dark dark:text-neutral-900 shadow-sketch font-bold scale-[1.02]' 
                    : 'hover:bg-control/75 text-pencil-muted hover:text-pencil font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-300 dark:text-amber-600' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Footer */}
        <div className="mt-auto pt-6 text-center text-xs text-pencil-muted font-hand border-t border-dashed border-neutral-300">
          LifeCycle v1.0.0<br/>
          สมุดจดชีวิตและการเงิน 📝
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-h-screen">
        
        {/* Top Header for Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b-2 border-pencil dark:border-pencil-dark bg-paper">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
            <span className="text-lg font-extrabold font-hand">LifeCycle</span>
          </div>
          
          <div className="text-xs font-hand font-bold bg-control/50 px-2 py-1 sketch-border-sm">
            👤 {userFullName}
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-grow p-4 md:p-8 max-w-5xl w-full mx-auto pb-24 md:pb-8 overflow-x-hidden">
          {renderActiveView()}
        </div>

        {/* Bottom Nav Bar for Mobile PWA Experience */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-2 border-pencil dark:border-pencil-dark bg-paper px-4 py-2 flex justify-around items-center z-50 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-1 font-hand text-[10px] transition-all gap-0.5 ${
                  isActive 
                    ? 'text-indigo-600 font-extrabold scale-110 font-bold' 
                    : 'text-pencil-muted hover:text-pencil font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

export default App;
