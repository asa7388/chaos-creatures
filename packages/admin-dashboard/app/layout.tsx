// Chaos Creatures Admin Dashboard — Root Layout
// TODO: Implement auth guard and sidebar navigation in Wave 2

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chaos Creatures Admin',
  description: 'Admin dashboard for Chaos Creatures game management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* TODO: Add Sidebar component and auth guard wrapper */}
        <main>{children}</main>
      </body>
    </html>
  );
}
