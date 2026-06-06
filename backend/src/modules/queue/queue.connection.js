import { getEnvVar } from '#utils/getEnvVar.js';

export function getRedisConnection() {
  const url = getEnvVar('REDIS_URL');

  return {
    url,
    maxRetriesPerRequest: null,
  };
}
