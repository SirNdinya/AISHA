import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL 
    || `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;

console.log(`[Redis] Initializing singleton: ${redisUrl.replace(/:\/\/[^@]+@/, '://***@')}`);

const redisConfig: any = { url: redisUrl };
if (redisUrl.startsWith('rediss://')) {
    redisConfig.socket = { 
        tls: true, 
        rejectUnauthorized: false,
        reconnectStrategy: (retries: number) => Math.min(retries * 200, 5000)
    };
}

const redisClient: RedisClientType = createClient(redisConfig) as RedisClientType;

redisClient.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error('Redis Client Error:', err.message);
    }
});

redisClient.on('connect', () => console.log('[Redis] Connected successfully!'));
redisClient.on('reconnecting', () => console.log('[Redis] Reconnecting...'));

// Connect once at startup
if (process.env.NODE_ENV !== 'test') {
    redisClient.connect().catch((err) => {
        console.error('[Redis] Initial connection failed:', err.message);
    });
}

export default redisClient;
