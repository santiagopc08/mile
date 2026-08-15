import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
