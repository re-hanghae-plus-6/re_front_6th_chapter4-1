export const getBaseUrl = (isProd) => {
  const port = process.env.PORT || 5173;
  return process.env.BASE || (isProd ? "/front_6th_chapter4-1/vanilla/" : `http://localhost:${port}/`);
};
