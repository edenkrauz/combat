import { Kafka } from 'kafkajs';
import{ getKafkaConfig } from './config.ts'; 
// import type { UserPayload } from '#src/types/event.types.ts';

const kafka = new Kafka(getKafkaConfig());

// Configure consumer with a distinct group ID
const producer = kafka.producer();
// const topicName = 'events.state';

// Continually fetch and produce data every 3 seconds
const runProducer = async () => {
  await producer.connect();
  console.log('Kafka TypeScript Producer connected.');
  
  // setInterval(() => {
  //   void (async () => {
  //   const payload: UserPayload = {
  //       name: 'Tamar',
  //       email: 'tamar.fyodorov',
  //       country: 'Israel',
  //       timestamp: Date.now(),
  //     };

  //     await producer.send({
  //       topic: topicName,
  //       messages: [
  //         {
  //           key: payload.email,
  //           value: JSON.stringify(payload),
  //         },
  //       ],
  //     });
  //   })();
  // }, 30000);
}  

// Handle clean shutdown to notify the broker the consumer is leaving the group
const shutdown = async () => {
    console.log('\nStopping Producer...');
    await producer.disconnect();
    process.exit(0);
};

process.on('SIGINT', () => {
    void shutdown();
});

process.on('SIGTERM', () => {
    void shutdown();
});

export { runProducer }
