import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();

  // If unauthenticated or non-admin, redirect to account/login
  if (!admin) {
    redirect('/account');
  }

  return (
    <div className="admin-layout-container">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="admin-brand-link">
            <Sparkles size={20} className="admin-brand-icon" />
            <span className="admin-brand-title">Sarang Admin</span>
          </Link>
          <span className="admin-badge-pill">Store Manager</span>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin" className="admin-nav-item">
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </Link>
          <Link href="/admin/products" className="admin-nav-item">
            <Package size={18} />
            <span>Products &amp; Stock</span>
          </Link>
          <Link href="/admin/categories" className="admin-nav-item">
            <FolderTree size={18} />
            <span>Categories</span>
          </Link>
          <Link href="/admin/orders" className="admin-nav-item">
            <ShoppingBag size={18} />
            <span>Customer Orders</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <ShieldCheck size={16} className="text-green" />
            <span className="admin-user-name">{admin.fullName || admin.email || 'Admin'}</span>
          </div>
          <Link href="/" target="_blank" className="admin-storefront-btn">
            <span>View Storefront</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <div className="admin-main-wrapper">
        <main className="admin-main-content">{children}</main>
      </div>
    </div>
  );
}
