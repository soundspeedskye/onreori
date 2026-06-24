import {Suspense} from 'react';

import {AuthPageClient} from './AuthPageClient';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="screen auth-screen">
          <div className="auth-screen__header">
            <p>ONREORI ACCOUNT</p>
            <h1>불러오는 중...</h1>
          </div>
        </main>
      }
    >
      <AuthPageClient />
    </Suspense>
  );
}
