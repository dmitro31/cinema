'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

import { getHomePath } from '@/lib/auth-redirect';
import { getErrorMessage } from '@/lib/get-error-message';
import { useAuth } from '@/provider/auth-provider';

import { AuthAlert } from './auth-ui';

export function GoogleAuthButton() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.min(400, Math.floor(entry.contentRect.width)));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const handleSuccess = async (response: CredentialResponse) => {
    setError(null);

    if (!response.credential) {
      setError('Google не повернув токен. Спробуйте ще раз.');
      return;
    }

    try {
      const user = await loginWithGoogle(response.credential);
      router.replace(getHomePath(user));
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Не вдалося увійти через Google.'));
    }
  };

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="flex min-h-11 justify-center">
        {width > 0 && (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Не вдалося увійти через Google.')}
            theme="filled_black"
            size="large"
            shape="pill"
            text="continue_with"
            width={width}
          />
        )}
      </div>

      {error && <AuthAlert>{error}</AuthAlert>}
    </div>
  );
}