'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tag,
  FolderTree,
  Users,
  MessageSquare,
  LogOut,
  ShieldCheck,
  ArrowUpRight,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';
import { loginUser } from '../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Login form state (empty - no hardcoded credentials!)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem('neut_admin_token');
    const savedUser = localStorage.getItem('neut_admin_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setAdminUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await loginUser({ email, password });
      if (res.user?.role !== 'ADMIN') {
        throw new Error('Tài khoản của bạn không có quyền truy cập hệ thống quản trị!');
      }

      setToken(res.accessToken);
      setAdminUser(res.user);
      localStorage.setItem('neut_admin_token', res.accessToken);
      localStorage.setItem('neut_admin_user', JSON.stringify(res.user));
    } catch (err: any) {
      setLoginError(err.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('neut_admin_token');
    localStorage.removeItem('neut_admin_user');
    router.push('/admin');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  // If not logged in, render authentication wall
  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-500">
              Admin CMS // Xác Thực Quản Trị
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase text-black tracking-tight mb-6">
            ĐĂNG NHẬP HỆ THỐNG
          </h1>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-500 text-red-700 text-xs font-mono font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1">
                Email Quản Trị Viên
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full border-2 border-neutral-300 p-2.5 text-xs font-mono focus:border-black outline-hidden pl-8"
                />
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase mb-1">Mật Khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-neutral-300 p-2.5 text-xs font-mono focus:border-black outline-hidden pl-8"
                />
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-black text-white p-3 text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ĐANG XÁC THỰC...</span>
                </>
              ) : (
                <span>VÀO TRANG QUẢN TRỊ</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Quản Lý Đơn Hàng', icon: Package },
    { href: '/admin/products', label: 'Quản Lý Kho Sản Phẩm', icon: Boxes },
    { href: '/admin/coupons', label: 'Mã Giảm Giá', icon: Tag },
    { href: '/admin/categories', label: 'Danh Mục', icon: FolderTree },
    { href: '/admin/users', label: 'Người Dùng', icon: Users },
    { href: '/admin/reviews', label: 'Đánh Giá', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black text-white shrink-0 border-r border-neutral-800 flex flex-col">
        <div className="p-6 border-b border-neutral-800">
          <Link href="/admin" className="font-extrabold text-lg tracking-tighter uppercase block">
            NEUT-STUDIO
          </Link>
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block mt-1">
            Admin Operations CMS
          </span>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <p className="font-bold text-white uppercase truncate max-w-[130px]">
                {adminUser?.fullName || 'Admin'}
              </p>
              <span className="text-[10px] text-green-400">● Role: ADMIN</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 border border-neutral-700 text-[11px] font-mono uppercase text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <span>Về Cửa Hàng</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
            Hệ thống quản trị thương mại điện tử
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-300 text-green-700 text-[10px] font-mono font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Sẵn Sàng Vận Hành
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
