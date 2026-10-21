import logger from 'jet-logger';
import server from './server.ts';
import { runConsumer } from './kafka/consumer.ts';

server.listen(8000, (err) => {
    if (err) {
        logger.err(err.message);
    } else {
        logger.info(`Express server started on port: 8000`);

        // Run the consumer in the background without awaiting it
        runConsumer().catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.err(`Error running Kafka consumer: ${errorMessage}`);
        });

        // runProducer().catch((error: unknown) => {
        //     const errorMessage = error instanceof Error ? error.message : String(error);
        //     logger.err(`Error running Kafka producer: ${errorMessage}`);
        // });
    }
});
