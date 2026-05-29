with open('src/lib/supabase.ts', 'r') as f:
    content = f.read()
content = content.replace('const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;', "const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';")
content = content.replace('const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;', "const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJh';")
with open('src/lib/supabase.ts', 'w') as f:
    f.write(content)
