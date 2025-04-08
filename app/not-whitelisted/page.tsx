import Link from 'next/link';

export default function NotWhitelistedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Restricted</h1>
          
          <div className="p-4 text-sm border rounded-md bg-amber-50 border-amber-200 text-amber-800">
            <p className="mb-3">
              Your Discord username was not found in the NS server whitelist.
            </p>
            <p>
              Make sure you are signing in with the same Discord account that you use in the NS server.
            </p>
          </div>
          
          <p className="text-gray-600">
            If you believe this is an error, please send a message to <span className="font-medium">jeahonglee</span> in Discord.
          </p>
        </div>
        
        <div className="pt-4 text-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
