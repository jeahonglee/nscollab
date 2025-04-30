import { Metadata } from 'next';
import WhitelistChecker from './whitelist-checker';
import CodeTabs from './code-tabs';
import CopyCode from './copy-code';

export const metadata: Metadata = {
  title: 'Discord Whitelist API Documentation',
  description: 'Documentation for the Discord whitelist verification API',
};

export default function ApiDocsPage() {
  const codeExamples = [
    {
      title: 'JavaScript',
      content: `// Simplest fetch example
fetch(\`https://nscollab.com/api/whitelist?username=discord_user\`)\n  .then(res => res.json())\n  .then(data => {\n    console.log(data.whitelisted ? \'Whitelisted\' : \'Not whitelisted\');\n  })\n  .catch(err => console.error(\'Error:\', err));`,
    },
    {
      title: 'React',
      content: `import { useState, useEffect } from 'react';

function WhitelistStatus({ username }) {
  const [isWhitelisted, setIsWhitelisted] = useState(null);

  useEffect(() => {
    if (!username) return;
    
    fetch(\`https://nscollab.com/api/whitelist?username=\${encodeURIComponent(username)}\`)\n      .then(res => res.json())\n      .then(data => setIsWhitelisted(data.whitelisted))\n      .catch(() => setIsWhitelisted(false));\n      \n  }, [username]);

  if (isWhitelisted === null) return <div>Loading...</div>;\n  \n  return <div>{isWhitelisted ? \'✅ Whitelisted\' : \'❌ Not whitelisted\'}</div>;\n}\n

// Usage: <WhitelistStatus username=\"discord_user\" />`,
    },
    {
      title: 'Python',
      content: `import requests

def check_whitelist(username):
    try:
        url = f\'https://nscollab.com/api/whitelist?username={username}\'\n        response = requests.get(url)
        return response.status_code == 200 and response.json().get(\'whitelisted\')\n    except:\n        return False

# Usage
print(check_whitelist(\"discord_user\"))`,
    },
    {
      title: 'PHP',
      content: `<?php
// Simple PHP example
$username = \'discord_user\';
$url = \'https://nscollab.com/api/whitelist?username=\' . urlencode($username);\n$response = file_get_contents($url);\n

if ($response) {\n    $data = json_decode($response, true);\n    echo ($data && $data[\'whitelisted\']) ? \'Whitelisted\' : \'Not whitelisted\';\n} else {\n    echo \'Error fetching status\';\n}\n?>`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Discord Whitelist API Documentation
      </h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Overview
        </h2>
        <p className="mb-4 text-gray-800 dark:text-gray-200">
          This API allows you to check if a Discord username is on our
          whitelist. You can use this to verify eligibility before directing
          users to sign up.
        </p>
        <p className="mb-4 text-gray-800 dark:text-gray-200">
          The API is publicly accessible and doesn&apos;t require
          authentication.
        </p>
      </div>

      <div className="mb-8">
        <WhitelistChecker />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          API Endpoint
        </h2>

        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
          <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">
            Check Whitelist Status
          </h3>
          <p className="mb-2 font-mono text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-2 rounded">
            GET https://nscollab.com/api/whitelist?username=discord_username
          </p>
          <p className="mb-4 text-gray-800 dark:text-gray-200">
            Checks if a Discord username is on the whitelist.
          </p>

          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
            Parameters
          </h4>
          <ul className="list-disc pl-6 mb-4 text-gray-800 dark:text-gray-200">
            <li>
              <span className="font-mono">username</span> - Discord username to
              check (required)
            </li>
          </ul>

          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
            Responses
          </h4>
          <div className="mb-4">
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              Success (200 OK)
            </p>
            <CopyCode
              code={`{
  "whitelisted": true|false
}`}
            />
          </div>

          <div className="mb-4">
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              Error (400 Bad Request)
            </p>
            <CopyCode
              code={`{
  "error": "Missing username parameter"
}`}
            />
          </div>

          <div className="mb-4">
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              Error (429 Too Many Requests)
            </p>
            <CopyCode
              code={`{
  "error": "Rate limit exceeded. Try again later."
}`}
            />
          </div>

          <div className="mb-4">
            <p className="font-medium text-gray-900 dark:text-white mb-2">
              Error (500 Internal Server Error)
            </p>
            <CopyCode
              code={`{
  "error": "Failed to check whitelist"
}`}
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Usage Examples
        </h2>
        <p className="mb-4 text-gray-800 dark:text-gray-200">
          Minimal examples to get you started quickly:
        </p>
        <CodeTabs tabs={codeExamples} />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Rate Limiting
        </h2>
        <p className="text-gray-800 dark:text-gray-200">
          The API is rate-limited to 1000 requests per 5 minutes per IP address.
          If you exceed this limit, you&apos;ll receive a 429 status code.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Security Tips
        </h2>
        <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200">
          <li className="mb-2">Always validate user input</li>
          <li className="mb-2">Use HTTPS for all requests</li>
          <li className="mb-2">Consider caching results to reduce API calls</li>
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Support
        </h2>
        <p className="text-gray-800 dark:text-gray-200">
          If you have any questions or need assistance, please reach out to our
          development team.
        </p>
      </div>
    </div>
  );
}
