import { spawnSync } from 'node:child_process';

const env = process.env.API_ENV;
if (env !== 'dev' && env !== 'qa') {
  throw new Error(`API_ENV must be 'dev' or 'qa'; got: ${env}`);
}

const result = spawnSync('npx', ['orval', '--config', 'api/orval.config.cjs'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
