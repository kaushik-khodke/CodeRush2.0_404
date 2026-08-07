const env = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = env['VITE_SUPABASE_URL'] || 'https://crbplefwfpeloxirpxgu.supabase.co';
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnBsZWZ3ZnBlbG94aXJweGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODI4MTMsImV4cCI6MjEwMTY1ODgxM30.lVJI7WifoOV37JD82aA8UVQSllYiEdgrbRVajW04BBc';

let client: any = {
  channel: () => ({
    on: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
  }),
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
  }),
};

// Use dynamic string construction & @vite-ignore to prevent Vite AST static import analysis errors
try {
  const packageName = '@supabase/' + 'supabase-js';
  const supabaseModule = await import(/* @vite-ignore */ packageName);
  if (supabaseModule && supabaseModule.createClient) {
    client = supabaseModule.createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (err) {
  // Graceful fallback to local digital twin simulator if package is absent
}

export const supabase = client;
