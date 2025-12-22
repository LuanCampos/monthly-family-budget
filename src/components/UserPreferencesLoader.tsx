import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const UserPreferencesLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  // This hook loads user preferences from the database when user logs in
  useUserPreferences(user, loading);
  
  return <>{children}</>;
};
