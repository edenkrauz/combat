import type { KafkaConfig } from 'kafkajs';
import { env } from 'node:process';

function requiredEnv(name: string): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function getBooleanEnv(name: string): boolean {
  const value = requiredEnv(name).toLowerCase();
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${name} must be "true" or "false"`);
  }
  return value === 'true';
}

export const getKafkaConfig = (): KafkaConfig => {
  const mechanism = requiredEnv('KAFKA_SASL_MECHANISM');
  if (mechanism !== 'scram-sha-512') {
    throw new Error('KAFKA_SASL_MECHANISM must be "scram-sha-512"');
  }

  const brokers = requiredEnv('KAFKA_BROKERS')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
  if (brokers.length === 0) {
    throw new Error('KAFKA_BROKERS must contain at least one broker');
  }

  return {
    clientId: requiredEnv('KAFKA_CLIENT_ID'),
    brokers,
    ssl: {
      rejectUnauthorized: getBooleanEnv('KAFKA_SSL_REJECT_UNAUTHORIZED'),
    },
    sasl: {
      mechanism,
      username: requiredEnv('KAFKA_SASL_USERNAME'),
      password: requiredEnv('KAFKA_SASL_PASSWORD'),
    },
  };
};

export default getKafkaConfig;