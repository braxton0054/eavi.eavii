'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/client';

export default function OAuthConsent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase, setSupabase] = useState<any>(null);
  
  const [clientName, setClientName] = useState('');
  const [scopes, setScopes] = useState<string[]>([]);
  const [redirectUri, setRedirectUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    // Parse OAuth parameters from URL
    const clientId = searchParams.get('client_id');
    const scope = searchParams.get('scope');
    const redirect = searchParams.get('redirect_uri');
    const responseType = searchParams.get('response_type');
    const state = searchParams.get('state');

    if (!clientId || !scope || !redirect || !responseType) {
      setError('Invalid OAuth request. Missing required parameters.');
      setLoading(false);
      return;
    }

    setRedirectUri(redirect);
    
    // Parse scopes
    const scopeList = scope.split(' ');
    setScopes(scopeList);

    // In a real implementation, you would fetch client details from Supabase
    // For now, we'll use a placeholder name
    setClientName('OAuth Application');

    setLoading(false);
  }, [searchParams]);

  const handleApprove = async () => {
    setApproving(true);
    setError('');

    try {
      const clientId = searchParams.get('client_id');
      const scope = searchParams.get('scope');
      const redirect = searchParams.get('redirect_uri');
      const responseType = searchParams.get('response_type');
      const state = searchParams.get('state');

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to login if not authenticated
        router.push(`/login/student?redirect=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // In a real implementation, you would:
      // 1. Create an authorization code in your database
      // 2. Redirect back to the client with the authorization code
      // For now, we'll simulate this by redirecting with the code
      
      const authCode = 'simulated_auth_code_' + Date.now();

      if (!redirect) {
        setError('Redirect URI is required');
        setApproving(false);
        return;
      }

      const redirectUrl = new URL(redirect);
      redirectUrl.searchParams.set('code', authCode);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      window.location.href = redirectUrl.toString();
    } catch (err) {
      setError('Failed to authorize. Please try again.');
      setApproving(false);
    }
  };

  const handleDeny = () => {
    const redirect = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    if (!redirect) {
      setError('Redirect URI is required');
      return;
    }

    const redirectUrl = new URL(redirect);
    redirectUrl.searchParams.set('error', 'access_denied');
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    window.location.href = redirectUrl.toString();
  };

  const getScopeDescription = (scope: string) => {
    const scopeDescriptions: { [key: string]: string } = {
      'read': 'Read your profile information',
      'write': 'Modify your profile information',
      'email': 'Access your email address',
      'profile': 'Access your basic profile',
      'openid': 'Authenticate using your account',
    };
    return scopeDescriptions[scope] || scope;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image
                src="/logo.webp"
                alt="East Africa Vision Institute Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authorization Error</h1>
          </div>
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200 text-center text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full max-w-md mx-auto px-4 md:px-6 py-8 md:py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          <div className="text-center mb-8">
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">
              <Image
                src="/logo.webp"
                alt="East Africa Vision Institute Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Authorize Access</h1>
            <p className="text-purple-200 text-sm md:text-base">
              <span className="font-semibold">{clientName}</span> is requesting access to your account
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">This application will be able to:</h2>
              <ul className="space-y-3">
                {scopes.map((scope, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-purple-100 text-sm">{getScopeDescription(scope)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
              <p className="text-purple-200 text-xs text-center">
                By authorizing, you allow this application to access your account information. You can revoke this access at any time.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? 'Authorizing...' : 'Authorize'}
              </button>
              
              <button
                onClick={handleDeny}
                disabled={approving}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg transition-colors duration-300 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-purple-300 text-xs">
                Redirecting to: <span className="font-mono text-purple-400">{new URL(redirectUri).hostname}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
