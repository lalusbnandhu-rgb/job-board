import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀  Server running  → http://localhost:${env.PORT}`);
    console.log(`📋  Health check   → http://localhost:${env.PORT}/health`);
    console.log(`🌍  Environment    → ${env.NODE_ENV}`);
  });
}

bootstrap();
