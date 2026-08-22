import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as supabaseJs from '@supabase/supabase-js';

// Mock the supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock 'server-only'
vi.mock('server-only', () => ({}));

describe('createServerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Ensure the module is re-evaluated with the new env vars
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://mock-url.com');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should call createClient with the correct parameters from environment variables', async () => {
    // Dynamically import the module to pick up the stubbed environment variables
    const { createServerClient } = await import('../../src/lib/supabase-server');

    // Invoke the function
    createServerClient();

    // Verify it was called with the right arguments
    expect(supabaseJs.createClient).toHaveBeenCalledTimes(1);
    expect(supabaseJs.createClient).toHaveBeenCalledWith(
      'http://mock-url.com',
      'mock-service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  });

  it('should return the mocked client', async () => {
    const mockClient = { mock: 'client' };
    vi.mocked(supabaseJs.createClient).mockReturnValue(mockClient as any);

    // Dynamically import to ensure isolation
    const { createServerClient } = await import('../../src/lib/supabase-server');
    const result = createServerClient();

    expect(result).toBe(mockClient);
  });
});
