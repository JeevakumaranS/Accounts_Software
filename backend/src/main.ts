import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const backendUrl = process.env.BACKEND_URL;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!backendUrl) {
    throw new Error('BACKEND_URL must be configured.');
  }

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL must be configured.');
  }

  const backendAddress = new URL(backendUrl);
  const frontendOrigin = new URL(frontendUrl).origin;

  if (!['http:', 'https:'].includes(backendAddress.protocol)) {
    throw new Error('BACKEND_URL must use HTTP or HTTPS.');
  }

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const configuredPort =
    process.env.PORT ||
    backendAddress.port ||
    (backendAddress.protocol === 'https:' ? '443' : '80');
  const port = Number(configuredPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('The backend URL or PORT must specify a valid port.');
  }

  await app.listen(port);
}

bootstrap();
