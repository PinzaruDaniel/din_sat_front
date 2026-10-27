import { ServicesContext } from './ServicesContext.js';
export function ServicesProvider({ services, children }) {
  return <ServicesContext value={services}>{children}</ServicesContext>;
}
