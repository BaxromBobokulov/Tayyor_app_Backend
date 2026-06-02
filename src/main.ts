import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Rasmlarni ko'rsatish uchun static assets ulash
  app.useStaticAssets(join(process.cwd(), 'src', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global response interceptor — barcha javoblar standart formatda
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS — frontend uchun
  app.enableCors({ origin: '*' });

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Socket.io adapter (WebSocket uchun)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AvtoEhtiyot API')
    .setDescription(
      'Avtomobil ehtiyot qismlari marketplace — Driver, Shop, Admin',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`🚀 Server ishlamoqda: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📖 Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
