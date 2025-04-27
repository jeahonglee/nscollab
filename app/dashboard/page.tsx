import { redirect } from 'next/navigation';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ weeks?: string }>;
}) {
  // Redirect from the old dashboard route to the new timeline route
  redirect('/timeline');
}
