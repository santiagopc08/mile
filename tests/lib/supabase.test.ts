import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supabaseJs from '@supabase/supabase-js';

// Mock the environment variables BEFORE importing the module
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mock-supabase-url.com');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    mock: 'supabase-client-instance'
  }))
}));

describe('supabase client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a supabase client using the correct environment variables', async () => {
    // Need to dynamically import to ensure it uses the mocked env variables
    const { supabase } = await import('../../src/lib/supabase');

    expect(supabaseJs.createClient).toHaveBeenCalledTimes(1);
    expect(supabaseJs.createClient).toHaveBeenCalledWith(
      'https://mock-supabase-url.com',
      'mock-anon-key'
    );

    expect(supabase).toBeDefined();
    expect(supabase).toEqual({ mock: 'supabase-client-instance' });
  });
});
