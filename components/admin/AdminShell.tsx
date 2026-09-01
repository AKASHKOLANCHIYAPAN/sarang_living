'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AdminShellProps {
  children: React.ReactNode;
  adminName: string;
}

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products & Stock', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Customer Orders', icon: ShoppingBag },
];

export default function AdminShell({ children, adminName }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch {}
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-layout-container">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="admin-mobile-overlay overlay-visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="admin-brand-link" onClick={() => setSidebarOpen(false)}>
            <Sparkles size={20} className="admin-brand-icon" />
            <span className="admin-brand-title">Sarang Admin</span>
          </Link>
          <span className="admin-badge-pill">Store Manager</span>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <ShieldCheck size={16} style={{ color: '#5A9E6F' }} />
            <span className="admin-user-name">{adminName}</span>
          </div>
          <Link
            href="/"
            target="_blank"
            className="admin-storefront-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <span>View Storefront</span>
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="admin-logout-btn"
          >
            <LogOut size={14} />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main-wrapper">
        <main className="admin-main-content">{children}</main>
      </div>

      {/* Mobile Toggle Button */}
      <button
        type="button"
        className="admin-mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle admin menu"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
}
