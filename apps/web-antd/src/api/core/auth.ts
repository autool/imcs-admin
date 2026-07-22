import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值（requestClient 已解包 data 部分） */
  export interface LoginResult {
    accessToken?: string;
    email?: string;
    expiresIn?: number;
    id?: string;
    mfaChallenge?: string;
    mfaRequired?: boolean;
    realName?: string;
    region_id?: string;
    region_name?: string;
    roles?: string[];
    token?: string;
    username?: string;
  }

  export interface RefreshTokenResult {
    access_token: string;
    token_type: string;
  }
}

export async function verifyMfaApi(challengeToken: string, code: string) {
  return requestClient.post<AuthApi.LoginResult>('/auth/mfa/verify', {
    challenge_token: challengeToken,
    code,
  });
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * LDAP 登录
 */
export async function ldapLoginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/ldap/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/auth/refresh_token',
    undefined,
    { withCredentials: true },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', undefined, {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
