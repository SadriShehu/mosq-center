'use client';
import { AuthGuard } from '@/components/AuthGuard';

export default function Page() {
  return (
    <AuthGuard>
      <div className="container">
        <br />
        <h1>Krijo Familje</h1>
        {/* TODO(pages-crud): build this page using components/ and lib/api */}
      </div>
    </AuthGuard>
  );
}
