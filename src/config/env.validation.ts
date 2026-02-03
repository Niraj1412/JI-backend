import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  MONGO_URI: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_USERNAME: Joi.string().default('default'),
  REDIS_PASSWORD: Joi.string().allow('', null),
  REDIS_DB: Joi.number().default(0),
  REDIS_PREFIX: Joi.string().default('job-import'),
  REDIS_TLS: Joi.boolean().truthy('true').falsy('false').default(false),
  JOB_BATCH_SIZE: Joi.number().default(200),
  QUEUE_CONCURRENCY: Joi.number().default(10),
  JOB_RETRY_ATTEMPTS: Joi.number().default(5),
  JOB_RETRY_BACKOFF_MS: Joi.number().default(5000),
  STORE_RAW_FEED: Joi.boolean().truthy('true').falsy('false').default(true),
  CLIENT_URL: Joi.string().default('http://localhost:3000'),
  CRON_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true)
});
