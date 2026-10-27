import { useEffect, useState } from 'react';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { AuthContext } from './AuthContext.js';
export function AuthProvider({ children }) {
  const { auth } = useServices();
  const [session, setSession] = useState({
    user: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    auth.session().then(
      ({ user }) => {
        if (active) setSession({ user, loading: false, error: null });
      },
      (error) => {
        if (active) setSession({ user: null, loading: false, error });
      },
    );
    const expire = () =>
      setSession({ user: null, loading: false, error: null });
    window.addEventListener('dinsat:session-expired', expire);
    return () => {
      active = false;
      window.removeEventListener('dinsat:session-expired', expire);
    };
  }, [auth]);
  async function authenticate(action, input) {
    const result = await auth[action](input);
    setSession({ user: result.user, loading: false, error: null });
    return result.user;
  }
  async function logout() {
    await auth.logout();
    setSession({ user: null, loading: false, error: null });
  }
  return (
    <AuthContext
      value={{
        ...session,
        login: (input) => authenticate('login', input),
        register: (input) => authenticate('register', input),
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
