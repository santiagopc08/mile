import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supabaseJs from '@supabase/supabase-js';
import { createServerClient } from '../../src/lib/supabase-server';

// Mock the supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock 'server-only'
vi.mock('server-only', () => ({}));

describe('createServerClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call createClient with the correct parameters from environment variables', () => {
    // Invoke the function
    createServerClient();

    // Verify it was called with the right arguments
    expect(supabaseJs.createClient).toHaveBeenCalledTimes(1);
    expect(supabaseJs.createClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  });

  it('should return the mocked client', () => {
    const mockClient = { mock: 'client' };
    vi.mocked(supabaseJs.createClient).mockReturnValue(mockClient as any);

    const result = createServerClient();

    expect(result).toBe(mockClient);
  });
});
