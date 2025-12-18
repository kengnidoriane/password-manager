import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Dashboard'
};

/**
 * Security Dashboard Page
 * View security analysis and recommendations
 */
export default function SecurityPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Security Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Monitor your vault security
        </p>
      </div>

      {/* Security dashboard will be implemented in future tasks */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">Security dashboard coming soon...</p>
      </div>
    </div>
  );
}
