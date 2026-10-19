import logger from 'jet-logger';
import server from './server.ts';

server.listen(8000, (err) => {
  if (!!err) {
    logger.err(err.message);
  } else {
    logger.info(`Express server started on port: 8000`);
  }
});
