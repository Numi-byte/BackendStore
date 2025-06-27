import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* 1️⃣  Allowed origins (env or fallback list) */
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .filter(Boolean)
    .map(o => o.trim());

  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      'http://localhost:5173',
      'https://furniture-frontend-virid.vercel.app',   // ← no trailing slash
    );
  }

  /* 2️⃣  CORS */
  app.enableCors({
    origin: (origin, cb) => {
      // allow REST clients and same‑origin requests with no Origin header
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`), false);
    },
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
