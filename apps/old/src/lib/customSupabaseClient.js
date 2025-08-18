import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvyzfeaswnohlomwnaov.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eXpmZWFzd25vaGxvbXduYW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDg3NTksImV4cCI6MjA2NzgyNDc1OX0.cI_qiXP4MC2DAK9G-00aIWvNvhLF8APNNNm3mUbm3NU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);