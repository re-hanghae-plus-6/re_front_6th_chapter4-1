// SSR 전용 라우터
export class SSRRouter {
  private routes: Array<{ path: string; component: any }> = [];
  
  addRoute(path: string, component: any) {
    this.routes.push({ path, component });
  }
  
  match(url: string) {
    // URL 정규화
    const normalizedUrl = url.replace(/\/$/, '') || '/';
    
    for (const route of this.routes) {
      if (route.path === '.*') {
        // 404 페이지
        continue;
      }
      
      if (route.path === normalizedUrl) {
        return { component: route.component, path: route.path };
      }
      
      // 동적 라우트 매칭 (예: /product/:id/)
      if (route.path.includes(':')) {
        const regex = new RegExp(
          '^' + route.path.replace(/:\w+/g, '([^/]+)') + '$'
        );
        const match = normalizedUrl.match(regex);
        if (match) {
          return { 
            component: route.component, 
            path: route.path,
            params: { id: match[1] }
          };
        }
      }
    }
    
    // 404 페이지 반환
    const notFoundRoute = this.routes.find(r => r.path === '.*');
    return notFoundRoute ? { component: notFoundRoute.component, path: '.*' } : null;
  }
}

export const ssrRouter = new SSRRouter();
