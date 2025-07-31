import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://wfvdepgdajlvlnlueltk.supabase.co';
const supabaseKey = 'sb_publishable_YUkME-ritj1BoU4YF0DELw_UZ5eKgEC';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };