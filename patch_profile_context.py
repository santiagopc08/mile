import re

with open('src/context/ProfileContext.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { supabase } from '@/lib/supabase';" not in content:
    content = content.replace("import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';", "import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';\nimport { supabase } from '@/lib/supabase';")

# Update useEffect
new_use_effect = """    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const savedProfile = sessionStorage.getItem('mile_profile') as Profile;
            const authStatus = sessionStorage.getItem('mile_auth');

            if (session && authStatus === 'true' && savedProfile) {
                setProfile(savedProfile);
                setIsAuthenticated(true);
            } else if (!session) {
                // If there's no supabase session, clear local auth
                sessionStorage.removeItem('mile_auth');
                sessionStorage.removeItem('mile_profile');
                setIsAuthenticated(false);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setIsAuthenticated(false);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);"""

content = re.sub(r'    useEffect\(\(\) => \{.*?\}, \[\]\);', new_use_effect, content, flags=re.DOTALL)

# Update logout
new_logout = """    const logout = async () => {
        await supabase.auth.signOut();
        sessionStorage.removeItem('mile_auth');
        sessionStorage.removeItem('mile_profile');
        setProfile(null);
        setIsAuthenticated(false);
    };"""

content = re.sub(r'    const logout = \(\) => \{.*?\};', new_logout, content, flags=re.DOTALL)

with open('src/context/ProfileContext.tsx', 'w') as f:
    f.write(content)
