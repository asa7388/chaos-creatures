// Chaos Creatures Admin Dashboard — Root Layout
// Includes Sidebar navigation and auth guard via middleware.
// Dark mode by default. Tailwind CSS.

import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import { cookies } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chaos Creatures Admin',
  description: 'Admin dashboard for Chaos Creatures game management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is on login page by checking for session cookie
  // Middleware handles actual auth enforcement; this controls layout rendering
  const cookieStore = cookies();
  const hasSession = cookieStore.has('admin_session');

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface">
        {hasSession ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-60 p-6 md:p-8">
              {children}
            </main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
