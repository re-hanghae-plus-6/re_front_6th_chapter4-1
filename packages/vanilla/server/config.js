/**
 * 서버 설정
 */
export const config = {
  development: {
    port: 5173,
    base: "/",
    enableVite: true,
    enableMSW: true,
  },
  production: {
    port: process.env.PORT || 3000,
    base: "/front_6th_chapter4-1/vanilla/",
    enableVite: false,
    enableMSW: false,
  },
};

/**
 * 현재 환경 설정 가져오기
 */
export const getConfig = () => {
  const env = process.env.NODE_ENV || "development";
  return config[env];
};
