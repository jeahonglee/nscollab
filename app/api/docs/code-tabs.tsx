'use client';

import { useState } from 'react';
import CopyCode from './copy-code';

type TabContent = {
  title: string;
  content: string;
};

export default function CodeTabs({ tabs }: { tabs: TabContent[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mb-8">
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === index
                ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <CopyCode code={tabs[activeTab].content} />
      </div>
    </div>
  );
}
