import { createClient } from 'redis';

export const redis = createClient({
    username: 'default',
    password: 'EhitLrOdzQHSxQVjiZqb8WGj0GVE4JYD',
    socket: {
        host: 'redis-13930.c73.us-east-1-2.ec2.cloud.redislabs.com',
        port: 13930
    }
});

redis.on('error', err => console.log('Redis Client Error', err));

await redis.connect();
