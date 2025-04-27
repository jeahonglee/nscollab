import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Users, Lightbulb, UserCircle } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated, redirect to dashboard
  if (user) {
    redirect('/timeline');
  }

  // Show landing page for non-signed-in users
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="space-y-6 text-center mb-16">
        <h1 className="text-5xl font-extrabold">Welcome to NS Collab</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and connect with Network School members, share project ideas,
          and build amazing things together.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/sign-in">
              Sign In with Discord
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Members Directory</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Discover NS members and their skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Find people to collaborate with, see their skills, and connect
              based on shared interests.
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects / Ideas</CardTitle>
              <Lightbulb className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Discover and share project ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Browse project ideas, submit your own, and find team members to
              bring them to life.
            </p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Community Hub</CardTitle>
              <UserCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>
              Stay updated with community activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              See the latest comments, ideas, and discussions from the NS
              community all in one place.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
