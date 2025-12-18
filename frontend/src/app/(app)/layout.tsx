import { MainLayout } from '@/components/layout/MainLayout';

/**
 * App Layout
 * Layout for authenticated app pages
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
