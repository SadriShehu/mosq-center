'use client';
import { AuthGuard } from '@/components/AuthGuard';

export default function Page() {
  return (
    <AuthGuard>
      <div className="container">
        <br />
        <h1>Kerko pagesat e pakryera</h1>
        {/* TODO(pages-payments): build this page using components/ and lib/api */}
      </div>
    </AuthGuard>
  );
}
