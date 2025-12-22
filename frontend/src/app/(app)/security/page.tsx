'use client';

import type { Metadata } from 'next';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { useRouter } from 'next/navigation';

/**
 * Security Dashboard Page
 * View security analysis and recommendations
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */
export default function SecurityPage() {
  const router = useRouter();

  /**
   * Handle password update request from security dashboard
   * Navigates to vault page with credential form open
   */
  const handleUpdatePassword = (credentialId: string) => {
    // Navigate to vault page with credential ID for editing
    router.push(`/vault?edit=${credentialId}`);
  };

  return (
    <div className="p-8">
      <SecurityDashboard onUpdatePassword={handleUpdatePassword} />
    </div>
  );
}
