import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Redirect from the old dashboard route to the new timeline route
  redirect('/timeline');
}
