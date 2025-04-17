import { signInWithOAuthAction } from '@/app/actions';
import { FormMessage, Message } from '@/components/form-message';
import { Button } from '@/components/ui/button';
import { FaDiscord } from 'react-icons/fa';

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col min-w-80">
      <h1 className="text-2xl font-medium">Sign in to NS Collab</h1>
      <p className="text-sm text-foreground mt-2">
        Access the NS community platform and connect with other members
      </p>

      <div className="flex flex-col gap-3 mt-8">
        <form action={signInWithOAuthAction.bind(null, 'discord')}>
          <Button
            className="w-full flex items-center gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]"
            type="submit"
          >
            <FaDiscord className="h-4 w-4" />
            <span>Continue with Discord</span>
          </Button>
        </form>

        <FormMessage message={searchParams} />

        <div className="text-xs text-center text-muted-foreground mt-4">
          This platform is for Network School members only.
          <br />
          Please use the same account you use for NS Discord.
          <br />
          If you are not whitelisted, please dm @jeahonglee in Discord
        </div>
      </div>
    </div>
  );
}
