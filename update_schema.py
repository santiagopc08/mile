import re

with open('supabase_schema.sql', 'r') as f:
    content = f.read()

# Replace all Anon Full Access policies
pattern = r'CREATE POLICY "Anon Full Access (.*?)" ON (.*?) FOR ALL TO anon USING \(true\) WITH CHECK \(true\);'
replacement = r'''CREATE POLICY "Auth Full Access \1" ON \2 FOR ALL TO authenticated USING (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app')) WITH CHECK (auth.jwt() ->> 'email' IN ('el@mile.app', 'ella@mile.app'));'''

new_content = re.sub(pattern, replacement, content)

with open('supabase_schema.sql', 'w') as f:
    f.write(new_content)
