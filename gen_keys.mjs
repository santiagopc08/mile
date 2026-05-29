import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing.');
}

const PROJECT_URL = 'https://ghazqlmvlptcysiruqig.supabase.co';

const iat = Math.floor(Date.now() / 1000);
const exp = iat + (60 * 60 * 24 * 365 * 10); // 10 years

const anonToken = jwt.sign({ role: 'anon', iss: 'supabase', iat, exp }, JWT_SECRET, { noTimestamp: true });
const serviceRoleToken = jwt.sign({ role: 'service_role', iss: 'supabase', iat, exp }, JWT_SECRET, { noTimestamp: true });

console.log('ANON:', anonToken);
console.log('SERVICE_ROLE:', serviceRoleToken);

const supabase = createClient(PROJECT_URL, serviceRoleToken);

async function check() {
    const { data, error } = await supabase.from('app_settings').select('*');
    if (error) {
        console.error("Error from Supabase:", error.message);
    } else {
        console.log("Success! Data:", data);
        console.log(JSON.stringify({ anonToken, serviceRoleToken }));
    }
}
check();
