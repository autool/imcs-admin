import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('runtime warning regression contract', () => {
  it('keeps the auth store independent from component router injection', () => {
    const source = readSource('./store/auth.ts');

    expect(source).not.toMatch(/import\s*\{[^}]*\buseRouter\b[^}]*\}/);
    expect(source).not.toContain('const router = useRouter()');
    expect(source).toContain("await import('#/router')");
  });

  it('uses isolated memory storage before preferences receive a namespace', () => {
    const source = readSource(
      '../../../packages/@core/preferences/src/preferences.ts',
    );

    expect(source).toContain('driver: new MemoryStorageDriver()');
    expect(source).not.toContain('this.cache = new StorageManager();');
  });

  it('uses stable local components for third-party login icons', () => {
    const source = readSource(
      './views/_core/authentication/third-party-login.vue',
    );

    expect(source).toContain("from 'lucide-vue-next'");
    expect(source).not.toContain('MdiLdap');
  });

  it('keeps the Ant Design App context holder required by the application', () => {
    const source = readSource('./app.vue');

    expect(source).toMatch(/import\s*\{[^}]*\bApp\b[^}]*\}/);
    expect(source).toMatch(/<App(?:\s|>)/);
  });

  it('waits for the initial router navigation before mounting the app', () => {
    const source = readSource('./bootstrap.ts');

    expect(source.indexOf('await router.isReady()')).toBeGreaterThan(-1);
    expect(source.indexOf('await router.isReady()')).toBeLessThan(
      source.indexOf("app.mount('#app')"),
    );
  });

  it('deduplicates Vue runtimes used by linked workspace packages', () => {
    const source = readSource('../vite.config.ts');

    expect(source).toContain("dedupe: ['vue', 'vue-router']");
  });
});
