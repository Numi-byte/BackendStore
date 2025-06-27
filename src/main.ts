import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* 1️⃣  Allowed origins */
  const allowedOrigins = [
    'http://localhost:5173',                        // local dev
    'https://furniture-frontend-virid.vercel.app/',             // Vercel preview/prod
    'https://www.your-domain.com',                  // custom domain (if any)
  ];

  /* 2️⃣  CORS */
  app.enableCors({
    origin: (origin, cb) => {
      // allow REST tools & same‑origin requests with no `Origin` header
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