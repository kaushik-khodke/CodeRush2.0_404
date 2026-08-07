import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://crbplefwfpeloxirpxgu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyYnBsZWZ3ZnBlbG94aXJweGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODI4MTMsImV4cCI6MjEwMTY1ODgxM30.lVJI7WifoOV37JD82aA8UVQSllYiEdgrbRVajW04BBc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
