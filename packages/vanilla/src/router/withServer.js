export const withServer = ({ ssr }, page) => {
  const pageWithSSR = (...args) => {
    if (typeof window === "undefined") {
      return page(...args);
    }
    return page(...args, {
      url: window.location.pathname,
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
      data: window.__INITIAL_DATA__,
    });
  };
  pageWithSSR.ssr = ssr;

  return pageWithSSR;
};
