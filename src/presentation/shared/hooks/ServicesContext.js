import { createContext, useContext } from 'react';
export const ServicesContext = createContext(null);
export function useServices() {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('ServicesProvider is missing.');
  return value;
}
