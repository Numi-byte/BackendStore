import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS to allow frontend requests (adjust origin if needed)
  app.enableCors({
    origin: 'http://localhost:5173',  // Your React/Vite frontend URL
    credentials: true,                // Allow cookies / auth headers
  });

  // Parse cookies
  app.use(cookieParser());

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
