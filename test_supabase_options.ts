import { createClient } from '@supabase/supabase-js';
const c = createClient('http://localhost', 'key', {
  global: {
    headers: { Authorization: 'Bearer test' }
  }
});
console.log(c);
