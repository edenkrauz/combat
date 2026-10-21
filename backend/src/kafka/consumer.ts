import { Kafka } from 'kafkajs';
import { getKafkaConfig } from './config.ts';
import type { EventRecord } from '../types/event.types.ts';
import {
  addEvent,
  updateEvent,
} from '#src/services/events.service.ts';
import logger from 'jet-logger';

const kafka = new Kafka(getKafkaConfig());

// Configure consumer with a distinct group ID
const consumer = kafka.consumer({ groupId: 'ts-user-analytics-group' });
const topicName = 'events.state';

const runConsumer = async () => {
  await consumer.connect();
  console.log('Kafka TypeScript Consumer connected. Listening for fetch streams...');

  await consumer.subscribe({ topic: topicName, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      if (!message.value) return;

      const rawValue = message.value.toString();
      console.log(`fetched record: ${rawValue}`);

      let eventData: EventRecord;
      try {
        eventData = JSON.parse(rawValue) as EventRecord;
      } catch (error: unknown) {
        const details = error instanceof Error ? error.message : String(error);
        logger.err(
          `Skipping invalid JSON at offset ${message.offset}, partition ${partition}: ${details}`,
        );
        return;
      }

      console.log(
        `\n[FETCHED RECORD] Offset: ${message.offset} on Partition: ${partition}`,
      );
      console.log('adding event to database...');

      try {
        const addedEvent = await addEvent(eventData);
        if (!addedEvent) {
          throw new Error(
            `Could not add event`,
          );
        }
        console.log('Added event:', addedEvent);
    

        const updatedEvent = await updateEvent(
          addedEvent.event_id,
          addedEvent.reality_id,
          { ...addedEvent, title: 'Haideeee edited' },
        );
        if (!updatedEvent) {
          throw new Error(
            `Could not update event`,
          );
        }
        console.log('Updated event:', updatedEvent);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.err(`Error adding or updating event: ${errorMessage}`);
      }
    },
  });
};

// Handle clean shutdown to notify the broker the consumer is leaving the group
const shutdown = async () => {
    console.log('\nStopping Consumer...');
    await consumer.disconnect();
    process.exit(0);
};

process.on('SIGINT', () => {
    void shutdown();
});

process.on('SIGTERM', () => {
    void shutdown();
});

export { runConsumer }
