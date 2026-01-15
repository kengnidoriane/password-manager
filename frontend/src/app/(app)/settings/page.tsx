import type { Metadata } from 'next';
import { TwoFactorSettings } from '@/components/auth/TwoFactorSettings';

export const metadata: Metadata = {
  title: 'Settings'
};

/**
 * Settings Page
 * User preferences and configuration
 */
export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Security Settings */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Security
          </h2>
          <TwoFactorSettings userId="current-user" />
        </div>

        {/* Other settings sections can be added here */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500">Additional settings coming soon...</p>
        </div>
      </div>
    </div>
  );
}
