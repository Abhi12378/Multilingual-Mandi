
import React from 'react';
import { ShoppingBag, Globe, Zap, ShieldCheck, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthPageProps {
  onLogin: (user: UserProfile) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Simulated Google Login
    onLogin({
      name: 'P SAAI ABHISHIKTH',
      role: 'Merchant',
      isGuest: false,
      avatar: 'AS'
    });
  };

  const handleGuestLogin = () => {
    onLogin({
      name: 'Guest Trader',
      role: 'Visitor',
      isGuest: true,
      avatar: 'GT'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Branding Side */}
        <div className="bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag className="text-indigo-600 w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Mandi Bridge</h1>
            </div>
            
            <h2 className="text-3xl font-extrabold mb-6 leading-tight">
              Empowering India's Local Trade through AI.
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <Globe className="w-6 h-6 shrink-0 opacity-80" />
                <div>
                  <h3 className="font-bold">Linguistic Freedom</h3>
                  <p className="text-sm opacity-70">Negotiate in any regional language with real-time translation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Zap className="w-6 h-6 shrink-0 opacity-80" />
                <div>
                  <h3 className="font-bold">Instant Price Discovery</h3>
                  <p className="text-sm opacity-70">Access live market rates from across India instantly.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <ShieldCheck className="w-6 h-6 shrink-0 opacity-80" />
                <div>
                  <h3 className="font-bold">Verified Data</h3>
                  <p className="text-sm opacity-70">AI-grounded search results for reliable market information.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-xs opacity-50 relative z-10">
            &copy; 2025 Multilingual Mandi Project. All rights reserved.
          </div>
        </div>

        {/* Action Side */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h3>
            <p className="text-slate-500">Sign in to sync your negotiations and favorite markets.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-slate-400 font-medium">Or</span>
              </div>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-slate-100 rounded-2xl text-slate-600 font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <UserCircle className="w-5 h-5" />
              Continue as Guest
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-400 px-6">
            By continuing, you agree to our <span className="text-indigo-600 underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-600 underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
