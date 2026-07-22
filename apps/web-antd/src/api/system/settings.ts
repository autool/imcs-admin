import { requestClient } from '#/api/request';

export const MASKED_SECRET_VALUE = '***';

export namespace SystemSettingsApi {
  export interface LdapCertificateInfo {
    issuer: string;
    notAfter: string;
    notBefore: string;
    serialNumber: string;
    sha256Fingerprint: string;
    signatureAlgorithm: string;
    subject: string;
  }

  export interface LdapUserPreview {
    attributes: Record<string, string>;
    dn: string;
    email: string;
    fullName: string;
    phone: string;
    username: string;
  }

  /** OAuth2 配置 */
  export interface OAuth2Config {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    userinfoUrl: string;
    scope?: string;
  }

  /** LDAP 配置 */
  export interface LdapConfig {
    enabled: boolean;
    server: string;
    port: number;
    useSsl?: boolean;
    baseDn: string;
    userDnTemplate: string;
    bindDn: string;
    bindPassword: string;
    // 用户搜索配置
    userSearchBase?: string;
    userSearchFilter?: string;
    // 字段映射
    usernameAttribute?: string;
    emailAttribute?: string;
    fullNameAttribute?: string;
    phoneAttribute?: string;
    caCertPath?: string;
    caCertFilename?: string;
    caCertUploadedAt?: string;
    caCertInfo?: Partial<LdapCertificateInfo>;
    // 同步配置
    syncEnabled?: boolean;
    syncInterval?: number;
    syncIntervalUnit?: 'day' | 'hour' | 'minute' | 'month' | 'week';
    defaultRoleIds?: string[];
    syncDisabledUsers?: boolean;
    hideDisabledUsers?: boolean;
    excludedDeptRules?: string[];
  }

  /** OAuth2 连接状态 */
  export interface OAuth2TestResult {
    status: string;
  }

  /** LDAP 连接状态 */
  export interface LdapTestResult {
    attributeFallbackReason: string;
    attributeFallbackUsed: boolean;
    baseDn: string;
    bindDn: string;
    caCertFilename: string;
    connected: boolean;
    legacyTlsFallbackUsed: boolean;
    matchedCount: number;
    port: number;
    sampleUser: LdapUserPreview | null;
    searchExecuted: boolean;
    searchFilter: string;
    server: string;
    status: string;
    strictTlsError: string;
    testUsername: string;
    useSsl: boolean;
    userSearchBase: string;
    userSearchFilterTemplate: string;
  }

  export interface LdapTestRequest {
    config: LdapConfig;
    testUsername?: string;
  }

  export type LdapCertificateUploadResult = Pick<
    LdapConfig,
    'caCertFilename' | 'caCertInfo' | 'caCertPath' | 'caCertUploadedAt'
  >;

  export interface LdapSyncResult {
    attributeFallbackReason: string;
    attributeFallbackUsed: boolean;
    baseDn: string;
    counts: {
      assignedDefaultRoles: number;
      createdDepartments: number;
      createdUsers: number;
      filteredDepartments: number;
      filteredDepartmentUsers: number;
      filteredDisabledUsers: number;
      ldapOuEntries: number;
      ldapUserEntries: number;
      lockedUsers: number;
      skippedUsers: number;
      unchangedUsers: number;
      updatedDepartments: number;
      updatedUsers: number;
    };
    defaultRoleIds: string[];
    defaultRoleNames: string[];
    legacyTlsFallbackUsed: boolean;
    rootDepartmentName: string;
    status: string;
    strictTlsError: string;
    syncedAt: string;
    userSearchBase: string;
    userSearchFilter: string;
    warnings: string[];
  }

  /** 公开认证方式 */
  export interface PublicAuthMethods {
    ldap: boolean;
    oauth2: boolean;
    oauth2Config?: null | Pick<
      OAuth2Config,
      'authorizeUrl' | 'clientId' | 'scope'
    >;
  }
}

// 公开接口 - 获取认证方式（不需要认证）
export async function getPublicAuthMethodsApi() {
  return requestClient.get<SystemSettingsApi.PublicAuthMethods>(
    '/system/settings/public/auth-methods',
  );
}

// OAuth2 配置接口
export async function getOAuth2ConfigApi() {
  return requestClient.get<SystemSettingsApi.OAuth2Config>(
    '/system/settings/oauth2',
  );
}

export async function saveOAuth2ConfigApi(
  data: SystemSettingsApi.OAuth2Config,
) {
  return requestClient.post<null>('/system/settings/oauth2', data);
}

export async function testOAuth2ConnectionApi() {
  return requestClient.get<SystemSettingsApi.OAuth2TestResult>(
    '/system/settings/oauth2/test',
  );
}

// LDAP 配置接口
export async function getLdapConfigApi() {
  return requestClient.get<SystemSettingsApi.LdapConfig>(
    '/system/settings/ldap',
  );
}

export async function saveLdapConfigApi(data: SystemSettingsApi.LdapConfig) {
  return requestClient.post<null>('/system/settings/ldap', data);
}

export async function uploadLdapCertificateApi(formData: FormData) {
  return requestClient.post<SystemSettingsApi.LdapCertificateUploadResult>(
    '/system/settings/ldap/certificate',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

export async function testLdapConnectionApi(
  data: SystemSettingsApi.LdapTestRequest,
) {
  return requestClient.post<SystemSettingsApi.LdapTestResult>(
    '/auth/ldap/test',
    data,
  );
}

export async function syncLdapDirectoryApi(data: {
  config: SystemSettingsApi.LdapConfig;
}) {
  return requestClient.post<SystemSettingsApi.LdapSyncResult>(
    '/system/settings/ldap/sync',
    data,
  );
}
