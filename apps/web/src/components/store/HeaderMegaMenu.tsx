'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Search, ShoppingBag, User, Menu, X, LogOut, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cart-store';
import { useAuthStore } from '../../stores/auth-store';

const AuthModal = dynamic(
  () => import('./AuthModal').then((mod) => mod.AuthModal),
  { ssr: false }
);

export function HeaderMegaMenu() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { openCart, openSearch, getTotalItems } = useCartStore();
  const { user, token, openAuthModal, logout } = useAuthStore();
  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Top Streetwear Ticker Banner */}
      <div className="bg-black text-white text-[11px] font-medium tracking-widest text-center py-1.5 px-4 uppercase">
        Freeship toàn quốc cho đơn từ 1.000.000 VND • Đổi trả tận nơi trong 15 ngày
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-black hover:opacity-70"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="font-extrabold text-xl md:text-2xl tracking-tighter text-black uppercase">
          NEUT-STUDIO
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-[13px] font-bold tracking-wider uppercase">
          <Link href="/shop" className="hover:text-neutral-500 transition-colors">
            Tất cả sản phẩm
          </Link>

          {/* Shop dropdown */}
          <div className="group relative py-4">
            <span className="cursor-pointer hover:text-neutral-500 transition-colors flex items-center gap-1">
              Danh mục
            </span>
            <div className="absolute top-full left-0 hidden group-hover:block w-56 bg-white border border-neutral-200 shadow-lg py-2">
              <Link href="/shop?categorySlug=tops" className="block px-4 py-2 text-xs hover:bg-neutral-100">
                Tops (Áo thun, Hoodie, Sơ mi)
              </Link>
              <Link href="/shop?categorySlug=bottoms" className="block px-4 py-2 text-xs hover:bg-neutral-100">
                Bottoms (Quần Jean, Short)
              </Link>
              <Link href="/shop?categorySlug=accessories" className="block px-4 py-2 text-xs hover:bg-neutral-100">
                Accessories (Phụ kiện)
              </Link>
              <Link href="/shop?categorySlug=bags" className="block px-4 py-2 text-xs hover:bg-neutral-100">
                Bags (Balo & Túi)
              </Link>
            </div>
          </div>

          <Link href="/track-order" className="hover:text-neutral-500 transition-colors">
            Tra cứu đơn hàng
          </Link>
        </nav>

        {/* Right action icons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={openSearch}
            className="p-2 text-black hover:opacity-60 transition-opacity cursor-pointer"
            title="Tìm kiếm sản phẩm"
          >
            <Search size={20} />
          </button>

          {/* User Account / Auth Modal Trigger */}
          {mounted && token && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1.5 text-xs font-mono font-bold border border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Tài khoản cá nhân"
              >
                <User size={16} />
                <span className="hidden lg:inline-block max-w-[100px] truncate uppercase">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-2 z-50 text-xs font-mono"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-neutral-200">
                    <p className="font-bold text-black truncate">{user.fullName}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-neutral-800 hover:bg-neutral-100 uppercase tracking-wider font-bold"
                  >
                    <Package size={14} />
                    <span>Đơn hàng của tôi</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 uppercase tracking-wider font-bold text-left cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="p-2 text-black hover:opacity-60 transition-opacity cursor-pointer"
              title="Đăng nhập / Đăng ký"
            >
              <User size={20} />
            </button>
          )}

          {/* Admin link removed from customer storefront */}

          <button
            onClick={openCart}
            className="p-2 text-black hover:opacity-60 transition-opacity relative cursor-pointer"
            title="Giỏ hàng"
          >
            <ShoppingBag size={20} />
            {mounted && totalItems > 0 && (
              <span className="absolute top-1 right-1 bg-black text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-4 space-y-3 uppercase font-bold text-sm tracking-wider">
          <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-1">
            Tất cả sản phẩm
          </Link>
          <Link href="/shop?categorySlug=tops" onClick={() => setMobileMenuOpen(false)} className="block py-1 pl-4 text-xs text-neutral-600">
            • Tops (Áo thun, Hoodie)
          </Link>
          <Link href="/shop?categorySlug=bottoms" onClick={() => setMobileMenuOpen(false)} className="block py-1 pl-4 text-xs text-neutral-600">
            • Bottoms (Quần jean, short)
          </Link>
          <Link href="/shop?categorySlug=accessories" onClick={() => setMobileMenuOpen(false)} className="block py-1 pl-4 text-xs text-neutral-600">
            • Accessories (Phụ kiện)
          </Link>
          <Link href="/shop?categorySlug=bags" onClick={() => setMobileMenuOpen(false)} className="block py-1 pl-4 text-xs text-neutral-600">
            • Bags (Balo & Túi)
          </Link>
          <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} className="block py-1">
            Tra cứu đơn hàng
          </Link>
          {mounted && token ? (
            <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-black font-mono">
              Tài khoản & Đơn hàng của tôi
            </Link>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal('login');
              }}
              className="block w-full text-left py-1 text-black font-mono"
            >
              Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      )}

      {/* Streetwear Auth Modal */}
      <AuthModal />
    </header>
  );
}
