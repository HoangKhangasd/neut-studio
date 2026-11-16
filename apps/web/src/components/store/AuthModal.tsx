'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { loginUser, registerUser } from '../../lib/api';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, setAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
    setError('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({ email, password });
      setAuth(res.user, res.accessToken);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({ email, password, fullName, phone });
      setAuth(res.user, res.accessToken);
      setSuccessMsg('Đăng ký tài khoản thành công!');
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isAuthModalOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isAuthModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 transition-all duration-200 ease-out transform ${
          isAuthModalOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-3 opacity-0'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black bg-neutral-100">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-neutral-500 block">
              NEUT-STUDIO // MEMBER ACCESS
            </span>
            <h2 className="text-base font-black uppercase tracking-tight text-black">
              {authModalTab === 'login' ? 'ĐĂNG NHẬP THÀNH VIÊN' : 'TẠO TÀI KHOẢN MỚI'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <button
            onClick={() => {
              setError('');
              openAuthModal('login');
            }}
            className={`py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
              authModalTab === 'login'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => {
              setError('');
              openAuthModal('register');
            }}
            className={`py-3 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
              authModalTab === 'register'
                ? 'bg-black text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Body content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-600 text-green-800 text-xs font-mono font-bold">
              {successMsg}
            </div>
          )}

          {authModalTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>ĐĂNG NHẬP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="text-[11px] font-mono text-neutral-500 hover:text-black hover:underline cursor-pointer"
                >
                  Chưa có tài khoản? Đăng ký ngay
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-black uppercase tracking-wider text-black mb-1">
                    Xác nhận
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 focus:border-black focus:bg-white text-xs font-mono outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>ĐĂNG KÝ TÀI KHOẢN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
