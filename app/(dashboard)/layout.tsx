import { AppShell } from '@/components/shell/app-shell';

/**
 * Every tab reads live account and position data from MySQL. Without this, Next
 * finds no dynamic API in these pages and happily prerenders them at build time:
 * the numbers would be whatever the database held on the build machine — or the
 * build would fail where there is no database at all — and stay frozen until
 * something called revalidatePath. Applies to every segment nested below.
 */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
