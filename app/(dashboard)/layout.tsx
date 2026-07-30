import { AppShell } from '@/components/shell/app-shell';

// Every tab reads MySQL but touches no dynamic API, so Next would prerender them
// at build time and freeze whatever the build machine's database held. Covers
// every nested segment.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
