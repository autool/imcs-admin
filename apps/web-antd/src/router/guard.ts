import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { getAllMenusApi } from '#/api';
import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';

// 从后端响应中直接获取 authCodes（按钮权限码）

function resolveFirstMenuPath(
  menus: Array<{ children?: any[]; path?: string }> = [],
): string {
  for (const menu of menus) {
    const children = Array.isArray(menu.children) ? menu.children : [];
    const childPath = resolveFirstMenuPath(children);
    if (childPath) {
      return childPath;
    }
    const currentPath = String(menu.path || '').trim();
    if (currentPath && currentPath.startsWith('/')) {
      return currentPath;
    }
  }
  return '';
}

function resolvePreferredHomePath(
  routes: Array<{ children?: any[]; name?: string; path?: string }> = [],
): string {
  const stack = [...routes];
  let firstRoutePath = '';

  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }
    const currentPath = String(current.path || '').trim();
    const currentName = String(current.name || '').trim();

    if (
      !firstRoutePath &&
      currentPath.startsWith('/') &&
      currentPath !== '/' &&
      currentName !== 'Profile' &&
      currentPath !== '/profile'
    ) {
      firstRoutePath = currentPath;
    }

    const children = Array.isArray(current.children) ? current.children : [];
    if (children.length > 0) {
      stack.unshift(...children);
    }
  }

  return firstRoutePath;
}

function hasPathInTree(
  nodes: Array<{ children?: any[]; path?: string }> = [],
  targetPath?: string,
): boolean {
  const normalizedTargetPath = String(targetPath || '').trim();
  if (!normalizedTargetPath) {
    return false;
  }

  for (const node of nodes) {
    const currentPath = String(node?.path || '').trim();
    if (currentPath === normalizedTargetPath) {
      return true;
    }

    const children = Array.isArray(node?.children) ? node.children : [];
    if (children.length > 0 && hasPathInTree(children, normalizedTargetPath)) {
      return true;
    }
  }

  return false;
}

function findRouteByName(
  routes: Array<{ children?: any[]; name?: string }> = [],
  routeName: string,
): any | null {
  for (const route of routes) {
    if (route?.name === routeName) {
      return route;
    }
    const children = Array.isArray(route?.children) ? route.children : [];
    const matchedChild = findRouteByName(children, routeName);
    if (matchedChild) {
      return matchedChild;
    }
  }
  return null;
}

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return decodeURIComponent(
          (to.query?.redirect as string) ||
            userStore.userInfo?.homePath ||
            preferences.app.defaultHomePath,
        );
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      if (
        to.path === preferences.app.defaultHomePath &&
        to.redirectedFrom?.path === '/' &&
        userStore.userInfo?.homePath &&
        userStore.userInfo.homePath !== preferences.app.defaultHomePath
      ) {
        return userStore.userInfo.homePath;
      }
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 从后端获取菜单和按钮权限码
    const menuResponse = await getAllMenusApi();
    const authCodes = menuResponse.authCodes ?? [];
    accessStore.setAccessCodes([...userRoles, ...authCodes]);

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      // 则会在菜单中显示，但是访问会被重定向到403
      routes: accessRoutes,
    });

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    const hasBusinessMenus = accessibleMenus.length > 0;
    const profileRoute = findRouteByName(accessRoutes as any[], 'Profile');
    const shouldFallbackToProfile = !hasBusinessMenus && !!profileRoute;
    if (shouldFallbackToProfile && profileRoute) {
      accessibleRoutes.push(profileRoute);
      if (!router.hasRoute('Profile')) {
        router.addRoute('Root', profileRoute);
      }
    }
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);
    const defaultHomePath = preferences.app.defaultHomePath;
    const defaultHomePathAccessible =
      hasPathInTree(
        accessibleRoutes as Array<{ children?: any[]; path?: string }>,
        defaultHomePath,
      ) ||
      hasPathInTree(
        accessibleMenus as Array<{ children?: any[]; path?: string }>,
        defaultHomePath,
      );
    const resolvedHomePath =
      (shouldFallbackToProfile ? '/profile' : '') ||
      (defaultHomePathAccessible ? defaultHomePath : '') ||
      resolvePreferredHomePath(
        accessibleRoutes as Array<{
          children?: any[];
          name?: string;
          path?: string;
        }>,
      ) ||
      resolveFirstMenuPath(accessibleMenus) ||
      defaultHomePath;
    const nextUserInfo = {
      ...userInfo,
      homePath:
        userInfo.homePath && userInfo.homePath !== '/'
          ? userInfo.homePath
          : resolvedHomePath,
    };
    userStore.setUserInfo(nextUserInfo);
    const redirectPath = (from.query.redirect ??
      (to.path === preferences.app.defaultHomePath
        ? nextUserInfo.homePath || preferences.app.defaultHomePath
        : to.fullPath)) as string;

    return {
      ...router.resolve(decodeURIComponent(redirectPath)),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
