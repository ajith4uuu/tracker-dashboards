import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisService {
  public client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    if (process.env.REDIS_URL) {
      this.initialize();
    } else {
      logger.info('Redis URL not configured, using in-memory cache');
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxConnectionAttempts) {
              logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Set up event handlers
      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis Client Reconnecting...');
        this.connectionAttempts++;
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected
   */
  get isOpen(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Set a key with expiration
   */
  async setEx(key: string, seconds: number, value: string): Promise<void> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    await this.client.setEx(key, seconds, value);
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.get(key);
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<number> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set multiple keys
   */
  async mSet(items: Record<string, string>): Promise<void> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    await this.client.mSet(items);
  }

  /**
   * Get multiple keys
   */
  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.mGet(keys);
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.incr(key);
  }

  /**
   * Add to a set
   */
  async sAdd(key: string, members: string[]): Promise<number> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.sAdd(key, members);
  }

  /**
   * Get set members
   */
  async sMembers(key: string): Promise<string[]> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.sMembers(key);
  }

  /**
   * Set hash field
   */
  async hSet(key: string, field: string, value: string): Promise<number> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.hSet(key, field, value);
  }

  /**
   * Get hash field
   */
  async hGet(key: string, field: string): Promise<string | undefined> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.hGet(key, field) || undefined;
  }

  /**
   * Get all hash fields
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.hGetAll(key);
  }

  /**
   * Set TTL on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    return await this.client.expire(key, seconds);
  }

  /**
   * Flush all data (use with caution)
   */
  async flushAll(): Promise<void> {
    if (!this.isOpen || !this.client) {
      throw new Error('Redis client not connected');
    }
    await this.client.flushAll();
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

export const redisClient = redisService.client;
export const initializeRedis = async () => {
  // Initialization happens in constructor
  return redisService.isOpen;
};

export default redisService;
