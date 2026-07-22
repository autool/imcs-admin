import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import {
  getUserInfoApi,
  ldapLoginApi,
  loginApi,
  logoutApi,
  verifyMfaApi,
} from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const loginLoading = ref(false);

  async function getRouter() {
    // Store 会在路由守卫中初始化，此时不能使用依赖组件注入上下文的 useRouter。
    const { router } = await import('#/router');
    return router;
  }

  async function completeLogin(
    res: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    const accessToken = res?.accessToken || res?.token;
    if (!accessToken) {
      return null;
    }

    accessStore.setAccessToken(accessToken);
    const userInfo = {
      avatar: '',
      desc: '',
      homePath: preferences.app.defaultHomePath,
      id: res.id,
      realName: res.realName || res.username,
      roles: res.roles || [],
      token: accessToken,
      username: res.username,
      userId: res.id || '',
      email: res.email || '',
      region_id: res.region_id,
      region_name: res.region_name,
    } as UserInfo;

    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(res.roles || []);

    if (accessStore.loginExpired) {
      accessStore.setLoginExpired(false);
    } else if (onSuccess) {
      await onSuccess();
    } else {
      const router = await getRouter();
      await router.push(userInfo.homePath || preferences.app.defaultHomePath);
    }

    if (userInfo.realName) {
      notification.success({
        description: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
        duration: 3,
        message: $t('authentication.loginSuccess'),
      });
    }
    return userInfo;
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    authMode: 'ldap' | 'local' = 'local',
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    try {
      loginLoading.value = true;
      const res =
        authMode === 'ldap'
          ? await ldapLoginApi(params)
          : await loginApi(params);
      if (res?.mfaRequired && res?.mfaChallenge) {
        return {
          mfaChallenge: res.mfaChallenge,
          mfaRequired: true,
          userInfo: null,
        };
      }
      const userInfo = await completeLogin(res, onSuccess);
      return {
        mfaChallenge: null,
        mfaRequired: false,
        userInfo,
      };
    } finally {
      loginLoading.value = false;
    }
  }

  async function verifyMfa(
    challengeToken: string,
    code: string,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;
      const res = await verifyMfaApi(challengeToken, code);
      return await completeLogin(res, onSuccess);
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    const router = await getRouter();
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    verifyMfa,
  };
});
