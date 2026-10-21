import type { KafkaConfig } from 'kafkajs';

export const getKafkaConfig = (): KafkaConfig => {
  return {
    clientId: 'tamar-client',
    brokers: ['127.0.0.1:9093'],
    ssl: {
      rejectUnauthorized: false, // Disables certificate verification and hostname checking
    },
    sasl: {
      mechanism: 'scram-sha-512',
      username: 'kafka-client',
      password: 'JaRuxqfgB8rH1p8uaCD0tvtFIR8E2qNl',
    },
  };
};

export default getKafkaConfig;