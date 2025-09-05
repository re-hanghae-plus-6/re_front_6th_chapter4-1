export const isServer = import.meta.env.SSR;

export const isClient = () => {
  return !import.meta.env.SSR;
};
