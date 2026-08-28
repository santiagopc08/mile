import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../../src/context/ProfileContext';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      setSession: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

const TestComponent = () => {
  const { profile, isAuthenticated } = useProfile();
  return (
    <div>
      <span data-testid="profile">{profile || 'none'}</span>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
    </div>
  );
};

describe('ProfileContext fallback on fetch error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('uses fallback local storage when supabase check throws', async () => {
    // Setup local storage
    localStorage.setItem('mile_auth', 'true');
    localStorage.setItem('mile_profile', 'ella');

    // Make supabase throw
    (supabase.auth.getSession as any).mockRejectedValue(new Error('Network error'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    // Initial state from localStorage should be applied immediately
    expect(screen.getByTestId('profile').textContent).toBe('ella');
    expect(screen.getByTestId('auth').textContent).toBe('yes');

    // Wait for async checkSession to complete and ensure it didn't break state
    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    // Verify state is maintained
    expect(screen.getByTestId('profile').textContent).toBe('ella');
    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });
});




describe('ProfileContext Validation & Edge Cases', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it('rejects login if backend validation fails (!res.ok)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false
    });

    let contextValue: any;
    const CaptureComponent = () => {
      contextValue = useProfile();
      return null;
    };

    render(
      <ProfileProvider>
        <CaptureComponent />
      </ProfileProvider>
    );

    const result = await contextValue.login('el', 'wrongpassword');
    expect(result).toBe(false);
    expect(contextValue.isAuthenticated).toBe(false);
  });

  it('rejects login if fetch throws an error (network error)', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network disconnected'));

    let contextValue: any;
    const CaptureComponent = () => {
      contextValue = useProfile();
      return null;
    };

    render(
      <ProfileProvider>
        <CaptureComponent />
      </ProfileProvider>
    );

    const result = await contextValue.login('el', 'password');
    expect(result).toBe(false);
    expect(contextValue.isAuthenticated).toBe(false);
  });

  it('rejects silent login if refresh returns a different profile', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ profile: 'ella' }) // Trying to login as 'el' but got 'ella'
    });

    let contextValue: any;
    const CaptureComponent = () => {
      contextValue = useProfile();
      return null;
    };

    render(
      <ProfileProvider>
        <CaptureComponent />
      </ProfileProvider>
    );

    const result = await contextValue.login('el'); // no password = silent login
    expect(result).toBe(false);
    expect(contextValue.isAuthenticated).toBe(false);
  });

  it('rejects login if setSession fails during standard login', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ session: { access_token: 'valid' } })
    });

    (supabase.auth.setSession as any).mockResolvedValue({
      error: new Error('Invalid session')
    });

    let contextValue: any;
    const CaptureComponent = () => {
      contextValue = useProfile();
      return null;
    };

    render(
      <ProfileProvider>
        <CaptureComponent />
      </ProfileProvider>
    );

    const result = await contextValue.login('el', 'password');
    expect(result).toBe(false);
    expect(contextValue.isAuthenticated).toBe(false);
  });

  it('ignores invalid profile values in localStorage during checkSession', async () => {
    // Setup local storage with invalid profile
    localStorage.setItem('mile_auth', 'true');
    localStorage.setItem('mile_profile', 'hacker');

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null
    });

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    // Initial state from localStorage should NOT be applied immediately because it's invalid
    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('no');

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    // Should still be none after async check
    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });
});


describe('ProfileContext checkSession Error Paths', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it('keeps profile null when supabase check throws and no local storage exists', async () => {
    (supabase.auth.getSession as any).mockRejectedValue(new Error('Fatal network error'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('no');

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });

  it('swallows fetch error during background sync silently', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { email: 'el@mile.app' },
          access_token: 'dummy-token'
        }
      },
      error: null
    });

    (global.fetch as any).mockRejectedValue(new Error('Sync failed'));

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/sync', expect.any(Object));
    });

    expect(screen.getByTestId('profile').textContent).toBe('el');
    expect(screen.getByTestId('auth').textContent).toBe('yes');
  });

  it('keeps profile null when session email is not allowed', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { email: 'hacker@evil.com' },
          access_token: 'dummy-token'
        }
      },
      error: null
    });

    render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(screen.getByTestId('auth').textContent).toBe('no');
  });
});
