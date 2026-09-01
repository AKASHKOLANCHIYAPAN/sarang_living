export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin login page has its own standalone layout — no sidebar, no admin chrome
  return <>{children}</>;
}
