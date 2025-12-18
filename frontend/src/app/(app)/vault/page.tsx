import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vault'
};

/**
 * Vault Page
 * Main password vault page
 */
export default function VaultPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Password Vault
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your secure credentials
        </p>
      </div>

      {/* Vault content will be implemented in future tasks */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-gray-500">Vault implementation coming soon...</p>
      </div>
    </div>
  );
}
