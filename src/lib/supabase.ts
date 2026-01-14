import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ⚠️ CONFIGURAÇÃO INCOMPLETA ⚠️
    
    As variáveis de ambiente do Supabase não estão configuradas.
    
    Para desenvolvimento local:
    - Copie .env.example para .env
    - Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
    
    Para produção (GitHub Actions):
    - Vá em Settings > Secrets and variables > Actions
    - Adicione os secrets: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
    - Consulte docs/security-actions-required.md para instruções detalhadas
    
    Valores recebidos:
    - VITE_SUPABASE_URL: ${supabaseUrl ? '[presente]' : '[AUSENTE]'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[presente]' : '[AUSENTE]'}
  `;
  
  // Em produção, mostrar no console E na página
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `<pre style="padding: 20px; color: red; white-space: pre-wrap;">${errorMessage}</pre>`;
  }
  
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
