import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iambwblptokdiwjkztss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhbWJ3YmxwdG9rZGl3amt6dHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTg3MTYsImV4cCI6MjA4MTU3NDcxNn0.w_il9JwSo8NFscHQ6aaJ9LNlpy06fbBh54sgg9FU1tw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
