import Link from 'next/link';

export default function NotWhitelistedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md border border-border">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
          
          <div className="p-4 text-sm border rounded-md bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
            <p className="mb-3">
              Your Discord username was not found in the NS server whitelist.
            </p>
            <p>
              Make sure you are signing in with the same Discord account that you use in the NS server.
            </p>
          </div>
          
          <p className="text-muted-foreground">
            If you believe this is an error, please send a message to <span className="font-medium">jeahonglee</span> in Discord.
          </p>
        </div>
        
        <div className="pt-4 text-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
