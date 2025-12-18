import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Generator'
};

/**
 * Password Generator Page
 * Generate secure passwords
 */
export default function GeneratorPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Password Generator
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create strong, secure passwords
        </p>
      </div>

      {/* Generator content will be implemented in future tasks */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">Password generator coming soon...</p>
      </div>
    </div>
  );
}
