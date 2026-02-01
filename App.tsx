
import React, { useState } from 'react';
import { ShoppingBag, LayoutDashboard, Languages, Info, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import MarketDashboard from './components/MarketDashboard';
import VoiceNegotiator from './components/VoiceNegotiator';
import AuthPage from './components/AuthPage';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'negotiate'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Multilingual Mandi
          </h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mandi Bridge
            </h1>
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Price Discovery
              {activeTab === 'dashboard' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
            <button
              onClick={() => { setActiveTab('negotiate'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'negotiate' 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Languages className="w-5 h-5" />
              Live Negotiator
              {activeTab === 'negotiate' && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase mb-2">
                <Info className="w-4 h-4" /> Help Center
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empowering India's local traders with cutting-edge AI for inclusive commerce.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${
                  user.isGuest ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {user.avatar || user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-sm text-rose-600 font-medium hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8 hidden md:block">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' ? 'Market Insights' : 'Real-time Negotiator'}
          </h2>
          <p className="text-slate-500">
            {activeTab === 'dashboard' 
              ? 'Discover current mandi rates across India.' 
              : 'Bridge the language gap with AI-driven voice mediation.'}
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' ? <MarketDashboard /> : <VoiceNegotiator />}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
