import { createClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';
const token = jwt.sign({
    role: 'authenticated',
    sub: 'el',
    profile: 'el'
}, 'dummy_secret');

const c = createClient('http://localhost', 'key', {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});
console.log(c.rest.headers.get('Authorization'));
