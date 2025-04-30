'use client';

import { useState } from 'react';

export default function WhitelistChecker() {
  const [username, setUsername] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWhitelist = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use absolute path to ensure we're hitting the correct API endpoint
      const response = await fetch(
        `/api/whitelist?username=${encodeURIComponent(username.trim())}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to check whitelist status');
      }

      const data = await response.json();
      setIsWhitelisted(data.whitelisted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username.trim() && !isLoading) {
      checkWhitelist();
    }
  };

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
      <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
        Try the API
      </h3>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter Discord username"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex-grow 
                     text-gray-900 dark:text-white bg-white dark:bg-gray-800 
                     placeholder-gray-500 dark:placeholder-gray-400"
          disabled={isLoading}
          aria-label="Discord username"
        />
        <button
          onClick={checkWhitelist}
          disabled={isLoading || !username.trim()}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md 
                     hover:bg-gray-800 dark:hover:bg-gray-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Check whitelist status"
        >
          {isLoading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {error && (
        <div
          className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md mb-4 border border-gray-300 dark:border-gray-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {isWhitelisted !== null && !error && (
        <div
          className={`p-3 rounded-md mb-4 border ${
            isWhitelisted
              ? 'bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700'
          }`}
          role="status"
        >
          {isWhitelisted
            ? '✅ User is whitelisted!'
            : '❌ User is not on the whitelist.'}
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        This demo makes a real API call to check if the Discord username is on
        the whitelist.
      </p>
    </div>
  );
}
