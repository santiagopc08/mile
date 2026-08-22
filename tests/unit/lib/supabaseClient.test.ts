import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We mock the external dependency so we don't make real network calls
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    isMock: true,
  })),
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    // Reset modules before each test to ensure fresh evaluation
    vi.resetModules();
  });

  afterEach(() => {
    // Clean up environment variables
    vi.unstubAllEnvs();
  });

  it('initializes Supabase client with correct environment variables', async () => {
    // Setup environment variables
    const testUrl = 'https://mock-url.supabase.co';
    const testKey = 'mock-anon-key';

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', testUrl);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', testKey);

    // Dynamically import to ensure it picks up the mocked environment variables
    const { createClient } = await import('@supabase/supabase-js');
    const { supabase } = await import('@/lib/supabaseClient');

    // Verify createClient was called with the environment variables
    expect(createClient).toHaveBeenCalledWith(testUrl, testKey);
    // Verify the exported instance is our mocked client
    expect(supabase).toHaveProperty('isMock', true);
  });
});
