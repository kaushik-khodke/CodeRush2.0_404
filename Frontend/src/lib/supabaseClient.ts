const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env['VITE_SUPABASE_URL'] || 'https://crbplefwfpeloxirpxgu.supabase.co';
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnBsZWZ3ZnBlbG94aXJweGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODI4MTMsImV4cCI6MjEwMTY1ODgxM30.lVJI7WifoOV37JD82aA8UVQSllYiEdgrbRVajW04BBc';

let client: any = {
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }),
};

try {
  // Try importing @supabase/supabase-js safely
  const supabaseModule = await import('@supabase/supabase-js');
  if (supabaseModule && supabaseModule.createClient) {
    client = supabaseModule.createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (err) {
  console.warn('[Supabase Client] @supabase/supabase-js module fallback active.');
}

export const supabase = client;
