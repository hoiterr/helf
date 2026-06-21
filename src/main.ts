import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // rawBody is required so we can verify provider webhook signatures (Whoop, etc.)
  // against the exact bytes that were signed, before the JSON body is parsed.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Allow the web app (separate dev origin) to call the API. CORS_ORIGIN can pin
  // this down in production; defaults to permissive for local dev.
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`helf backend listening on :${port}`);
}

void bootstrap();
