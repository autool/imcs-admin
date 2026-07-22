import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { MASKED_SECRET_VALUE } from '#/api/system/settings';

function readSettingsView(filename: string) {
  return readFileSync(
    join(process.cwd(), 'apps/web-antd/src/views/system/settings', filename),
    'utf8',
  );
}

describe('system settings secret placeholder contract', () => {
  it('uses a shared masked secret placeholder value', () => {
    expect(MASKED_SECRET_VALUE).toBe('***');
  });

  it('explains OAuth2 secret placeholder semantics in the form', () => {
    const source = readSettingsView('oauth2-settings.vue');

    expect(source).toContain('MASKED_SECRET_VALUE');
    expect(source).toContain('表示已配置密钥');
    expect(source).toContain('保持不变会继续使用原密钥');
    expect(source).toContain('输入新值才会替换');
  });

  it('explains LDAP bind password placeholder semantics in the form', () => {
    const source = readSettingsView('ldap-settings.vue');

    expect(source).toContain('MASKED_SECRET_VALUE');
    expect(source).toContain('表示已配置绑定密码');
    expect(source).toContain('保持不变会继续使用原密码');
    expect(source).toContain('输入新值才会替换');
  });
});
