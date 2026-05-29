const { createClient } = require('@supabase/supabase-js');
const c = createClient('http://localhost', 'key', {
  global: {
    fetch: (url, options) => {
      console.log('Fetching with headers:', options.headers);
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
  }
});
c.from('events').select('*').then(() => console.log('Done'));
