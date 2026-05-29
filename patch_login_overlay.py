import re

with open('src/components/LoginOverlay.tsx', 'r') as f:
    content = f.read()

# Make handleSubmit async and add supabase Auth sign-in logic
new_handle_submit = """    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfile) return;

        if (keyword.trim().toLowerCase() === PASSWORDS[selectedProfile]) {
            try {
                // Setup the user in Supabase if necessary
                const res = await fetch('/api/auth/setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profile: selectedProfile, password: keyword.trim().toLowerCase() })
                });

                if (!res.ok) {
                    throw new Error('Setup failed');
                }

                const { email, password } = await res.json();

                // Sign in with Supabase Auth
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) throw signInError;

                onLoginSuccess(selectedProfile);
            } catch (err) {
                console.error('Authentication error:', err);
                setError(true);
                setTimeout(() => setError(false), 2000);
            }
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };"""

content = re.sub(
    r'    const handleSubmit = \(e: React.FormEvent\) => \{.*?\n    \};',
    new_handle_submit,
    content,
    flags=re.DOTALL
)

# Add import for supabase
if "import { supabase } from '@/lib/supabase';" not in content:
    content = content.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { supabase } from '@/lib/supabase';")

with open('src/components/LoginOverlay.tsx', 'w') as f:
    f.write(content)
