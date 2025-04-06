import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { IdeaForm } from '@/components/ideas/idea-form';

export default async function NewIdeaPage() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  // Fetch user profile to ensure it exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // If profile doesn't exist, redirect to profile creation
  if (!profile) {
    redirect('/profile/me');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit New Idea</h1>
      <IdeaForm user={user} />
    </div>
  );
}
