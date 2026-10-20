import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.ts';
import BaseRouter from './routers/api.router.ts';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add APIs, must be after middleware
app.use('/', BaseRouter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Add error handler. `_next` must stay: Express only treats 4-arg middleware
// as an error handler.
app.use((err: Error, _: Request, res: Response, _next: NextFunction) => {
  if ('type' in err) {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
  }
  return res.status(500).json({ error: `Internal Server Error: ${err.message}` });
});

app.get('/', (_: Request, res: Response) => {
  res.json({ message: 'hello world' });
});

export default app;
