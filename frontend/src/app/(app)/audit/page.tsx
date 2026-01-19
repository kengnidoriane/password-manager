/**
 * Audit Log Page
 * 
 * Displays the audit log component for viewing account activity history.
 * 
 * Requirements: 18.2, 18.3, 18.4
 */

import { AuditLog } from '@/components/audit';

export default function AuditPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <AuditLog />
    </div>
  );
}
