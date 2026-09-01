import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthenticatedAdmin();

  // If unauthenticated or non-admin, redirect to admin login
  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <AdminShell adminName={admin.fullName || admin.email || 'Admin'}>
      {children}
    </AdminShell>
  );
}
