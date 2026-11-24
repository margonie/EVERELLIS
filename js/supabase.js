const SUPABASE_URL = "https://mpbvfgzieckqtuwtnlqb.supabase.co";
const SUPABASE_KEY = "sb_publishable__s5dmXDb2CdG7MxmE2BqJQ_31u545FR";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabaseClient;
