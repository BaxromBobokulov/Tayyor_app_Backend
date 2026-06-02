🤖 MASTER PROMPT — AvtoEhtiyot Backend (NestJS + Prisma)

🎯 LOYIHA HAQIDA (Kontekst)
Sen tajribali Senior Backend Developer sifatida ishlaysan.
Men senga AvtoEhtiyot degan mobil ilova backendini yozib berishingni so'rayman.
Ilova g'oyasi:

Haydovchilar avtomobil ehtiyot qismlarini rasmga olib, ilovaga post qilishadi
Sotuvchi do'konlar bu postlarni ko'rib, narx taklif qilishadi (Offer)
Haydovchi takliflarni ko'rib, do'kon bilan chat orqali gaplashadi
Haydovchi do'konning lokatsiyasi va raqamini ko'ra oladi
Kelishuv bo'lgach, so'rov yopiladi


🗄️ PRISMA SCHEMA (O'zgartirilmaydi)
prismagenerator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  fullName     String
  phoneNumber  String   @unique
  password     String
  role         Role     @default(DRIVER)
  avatarUrl    String?
  fcmToken     String?
  refreshToken String?
  isActive     Boolean  @default(true)
  isBlocked    Boolean  @default(false)

  requests         Request[]
  shop             Shop?
  sentMessages     Message[]      @relation("SentMessages")
  notifications    Notification[]
  reviewsGiven     Review[]       @relation("ReviewsGiven")
  reviewsReceived  Review[]       @relation("ReviewsReceived")

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum Role {
  DRIVER
  SHOP
  ADMIN
}

model Shop {
  id           Int      @id @default(autoincrement())
  name         String
  description  String?
  address      String
  lat          Float?
  lng          Float?
  phoneNumber  String
  workingHours String?
  telegram     String?
  categories   String[]
  brands       String[]
  rating       Float    @default(0.0)
  reviewCount  Int      @default(0)
  isVerified   Boolean  @default(false)
  isOpen       Boolean  @default(true)
  ownerId      Int      @unique
  owner        User     @relation(fields: [ownerId], references: [id])
  offers       Offer[]
  reviews      Review[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Request {
  id              Int           @id @default(autoincrement())
  carModel        String
  carYear         Int
  carBody         String?
  vinCode         String?
  partName        String
  partNumber      String?
  description     String?
  regionId        Int?
  region          Region?       @relation(fields: [regionId], references: [id])
  images          Image[]
  status          RequestStatus @default(OPEN)
  acceptedOfferId Int?          @unique
  acceptedOffer   Offer?        @relation("AcceptedOffer", fields: [acceptedOfferId], references: [id])
  driverId        Int
  driver          User          @relation(fields: [driverId], references: [id])
  offers          Offer[]
  chats           Chat[]
  viewCount       Int           @default(0)
  expiresAt       DateTime?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum RequestStatus {
  OPEN
  IN_PROGRESS
  CLOSED
  CANCELLED
  EXPIRED
}

model Image {
  id        Int     @id @default(autoincrement())
  url       String
  publicId  String?
  requestId Int
  request   Request @relation(fields: [requestId], references: [id], onDelete: Cascade)
}

model Offer {
  id           Int         @id @default(autoincrement())
  price        Decimal     @db.Decimal(12, 2)
  currency     String      @default("UZS")
  condition    Condition   @default(NEW)
  delivery     Boolean     @default(false)
  deliveryTime String?
  comment      String?
  warranty     String?
  status       OfferStatus @default(PENDING)
  requestId    Int
  request      Request     @relation(fields: [requestId], references: [id], onDelete: Cascade)
  shopId       Int
  shop         Shop        @relation(fields: [shopId], references: [id], onDelete: Cascade)
  acceptedRequest Request? @relation("AcceptedOffer")
  chat         Chat?

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

enum OfferStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum Condition {
  NEW
  USED
  REFURBISHED
}

model Chat {
  id        Int       @id @default(autoincrement())
  requestId Int
  request   Request   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  offerId   Int?      @unique
  offer     Offer?    @relation(fields: [offerId], references: [id])
  messages  Message[]
  createdAt DateTime  @default(now())
}

model Message {
  id        Int      @id @default(autoincrement())
  text      String?
  imageUrl  String?
  isRead    Boolean  @default(false)
  chatId    Int
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId  Int
  sender    User     @relation("SentMessages", fields: [senderId], references: [id])
  createdAt DateTime @default(now())
}

model Review {
  id        Int      @id @default(autoincrement())
  rating    Int
  comment   String?
  authorId  Int
  author    User     @relation("ReviewsGiven", fields: [authorId], references: [id])
  targetId  Int
  target    User     @relation("ReviewsReceived", fields: [targetId], references: [id])
  shopId    Int
  shop      Shop     @relation(fields: [shopId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model Notification {
  id        Int              @id @default(autoincrement())
  title     String
  body      String
  type      NotificationType
  isRead    Boolean          @default(false)
  data      Json?
  userId    Int
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime         @default(now())
}

enum NotificationType {
  NEW_OFFER
  OFFER_ACCEPTED
  OFFER_REJECTED
  NEW_MESSAGE
  REQUEST_EXPIRED
  SYSTEM
}

model Region {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  requests Request[]
}

📦 TEXNOLOGIYALAR STACK

Framework: NestJS (TypeScript)
ORM: Prisma
Database: PostgreSQL
Auth: JWT (Access 15min + Refresh 7d), Passport.js
Real-time: Socket.io (WebSocket — Chat uchun)
File Upload: Cloudinary + Multer
Push Notification: Firebase Admin SDK (FCM)
API Docs: Swagger (@nestjs/swagger)
Validation: class-validator + class-transformer
Password: bcrypt
Cache: @nestjs/cache-manager
Rate limit: @nestjs/throttler


🏗️ PAPKA STRUKTURASI
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── ws-jwt.guard.ts          ← WebSocket uchun
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts  ← Standart response format
│   └── constants/
│       └── roles.constant.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts
    │   │   └── jwt-refresh.strategy.ts
    │   └── dto/
    │       ├── register.dto.ts
    │       ├── login.dto.ts
    │       └── refresh-token.dto.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── dto/
    │       └── update-user.dto.ts
    ├── shops/
    │   ├── shops.module.ts
    │   ├── shops.controller.ts
    │   ├── shops.service.ts
    │   └── dto/
    │       ├── create-shop.dto.ts
    │       └── update-shop.dto.ts
    ├── requests/
    │   ├── requests.module.ts
    │   ├── requests.controller.ts
    │   ├── requests.service.ts
    │   └── dto/
    │       ├── create-request.dto.ts
    │       ├── update-request.dto.ts
    │       └── filter-request.dto.ts
    ├── offers/
    │   ├── offers.module.ts
    │   ├── offers.controller.ts
    │   ├── offers.service.ts
    │   └── dto/
    │       ├── create-offer.dto.ts
    │       └── respond-offer.dto.ts
    ├── chat/
    │   ├── chat.module.ts
    │   ├── chat.service.ts
    │   ├── chat.gateway.ts           ← WebSocket Gateway
    │   ├── chat.controller.ts
    │   └── dto/
    │       └── send-message.dto.ts
    ├── notifications/
    │   ├── notifications.module.ts
    │   ├── notifications.controller.ts
    │   └── notifications.service.ts
    ├── upload/
    │   ├── upload.module.ts
    │   ├── upload.controller.ts
    │   └── upload.service.ts         ← Cloudinary
    ├── regions/
    │   ├── regions.module.ts
    │   ├── regions.controller.ts
    │   └── regions.service.ts
    └── admin/
        ├── admin.module.ts
        ├── admin.controller.ts
        └── admin.service.ts

📋 HAR BIR MODUL — BATAFSIL TALABLAR

🔐 AUTH MODULE
Endpointlar:
POST /auth/register          → Ro'yxatdan o'tish (DRIVER yoki SHOP)
POST /auth/login             → Kirish
POST /auth/refresh           → Access tokenni yangilash
POST /auth/logout            → Chiqish (refreshToken o'chirish)
GET  /auth/me                → Joriy foydalanuvchi [JWT kerak]
Logika:

register: phoneNumber unique tekshir, password bcrypt(10) hash, role faqat DRIVER yoki SHOP, JWT access + refresh token qaytar
login: phoneNumber + password tekshir, isActive + isBlocked tekshir, token qaytar
refresh: refreshToken DB dagi bilan solishtir (hash), yangi juft token qaytar
logout: DB dagi refreshToken ni null qil
Access token: 15m, Refresh token: 7d
RefreshToken ham bcrypt bilan hashlanib saqlansin DB da

DTOlar (class-validator bilan):
typescript// register.dto.ts
fullName: string           // @IsString() @MinLength(3)
phoneNumber: string        // @IsString() @Matches(/^\+998[0-9]{9}$/)
password: string           // @IsString() @MinLength(6)
role: Role                 // @IsEnum([DRIVER, SHOP])

// login.dto.ts
phoneNumber: string
password: string

👤 USERS MODULE
Endpointlar:
GET    /users/me              → O'z profilim [JWT]
PATCH  /users/me              → Profilni tahrirlash [JWT]
PATCH  /users/me/avatar       → Avatar yuklash [JWT]
DELETE /users/me              → Hisobni o'chirish [JWT]
GET    /users/me/notifications → O'z bildirishnomalarim [JWT]
Logika:

Avatar Cloudinary ga yuklansin
Password o'zgartirishda eski parolni so'rasin


🏪 SHOPS MODULE
Endpointlar:
POST   /shops                 → Do'kon yaratish [SHOP role]
GET    /shops                 → Barcha do'konlar (filter bilan)
GET    /shops/:id             → Bitta do'kon
PATCH  /shops/:id             → Tahrirlash [O'z do'koni]
DELETE /shops/:id             → O'chirish [O'z do'koni yoki ADMIN]
GET    /shops/nearby          → Yaqin atrofdagi do'konlar (lat, lng, radius)
GET    /shops/:id/reviews     → Do'kon sharhlari
Filter parametrlari (?query):

category → kategoriya bo'yicha
brand → brend bo'yicha
isVerified → tasdiqlangan
lat, lng, radius → geolokatsiya (Haversine formula)
page, limit → pagination

Geolokatsiya logikasi (Haversine):
typescript// Masofani hisoblash uchun raw SQL yoki formula
// Prisma raw query bilan amalga oshir
const shops = await this.prisma.$queryRaw`
  SELECT *, 
    (6371 * acos(cos(radians(${lat})) * cos(radians(lat)) 
    * cos(radians(lng) - radians(${lng})) 
    + sin(radians(${lat})) * sin(radians(lat)))) AS distance 
  FROM "Shop"
  HAVING distance < ${radius}
  ORDER BY distance
`

📋 REQUESTS MODULE
Endpointlar:
POST   /requests              → So'rov yaratish [DRIVER]
GET    /requests              → Barcha so'rovlar (filter) [SHOP ko'radi]
GET    /requests/my           → O'zim yaratganlarim [DRIVER]
GET    /requests/:id          → Bitta so'rov (viewCount++)
PATCH  /requests/:id          → Tahrirlash [O'z so'rovi, OPEN statusda]
DELETE /requests/:id          → O'chirish [O'z so'rovi yoki ADMIN]
PATCH  /requests/:id/cancel   → Bekor qilish [DRIVER]
Filter parametrlari:

carModel, partName, regionId
status → OPEN, IN_PROGRESS, CLOSED
page, limit

Logika:

Yaratishda rasm upload (1-5 ta rasm, Cloudinary)
viewCount: GET /requests/:id da har marta +1
expiresAt: yaratishda now() + 3 kun avtomatik qo'yilsin
Cron job: har kecha 00:00 da expiresAt o'tgan OPEN requestlarni EXPIRED qil va driver ga notification yubor


💰 OFFERS MODULE
Endpointlar:
POST   /offers                     → Taklif berish [SHOP]
GET    /offers/request/:requestId  → So'rovga kelgan takliflar [DRIVER, o'z so'rovi]
GET    /offers/my                  → Mening takliflarim [SHOP]
PATCH  /offers/:id/accept          → Qabul qilish [DRIVER]
PATCH  /offers/:id/reject          → Rad etish [DRIVER]
PATCH  /offers/:id/withdraw        → Qaytarib olish [SHOP]
Logika:

Taklif berilganda:

Offer yaratiladi
Driver ga NEW_OFFER notification yuboriladi (FCM + DB)
Request status IN_PROGRESS bo'ladi (agar birinchi offer bo'lsa)
Offer va Request o'rtasida Chat avtomatik yaratiladi


accept bosilganda:

OfferStatus → ACCEPTED
Request.acceptedOfferId set qilinadi
RequestStatus → CLOSED
Boshqa offerlar REJECTED bo'ladi
Shop ga OFFER_ACCEPTED notification


reject bosilganda:

OfferStatus → REJECTED
Shop ga OFFER_REJECTED notification


Bir do'kon bitta requestga faqat 1 ta offer bera oladi (unique tekshir)


💬 CHAT MODULE
HTTP Endpointlar:
GET /chat/request/:requestId    → So'rovga tegishli chatlar ro'yxati [Driver]
GET /chat/:chatId/messages      → Chat tarixini olish (pagination)
WebSocket Events (Socket.io):
// CLIENT → SERVER
connection          → handshake: { token: "JWT" }
joinChat            → { chatId: number }
sendMessage         → { chatId: number, text?: string, imageUrl?: string }
markAsRead          → { chatId: number }
typing              → { chatId: number, isTyping: boolean }

// SERVER → CLIENT
newMessage          → Message object
messageRead         → { chatId: number }
userTyping          → { chatId: number, userId: number, isTyping: boolean }
error               → { message: string }
Logika:

WebSocket ga ulanishda JWT token handshake da tekshiriladi (WsJwtGuard)
Faqat shu chatga tegishli ikki kishi ulanishi mumkin (Driver + Shop owner)
sendMessage da FCM notification ham yuboriladi (agar foydalanuvchi offline bo'lsa)
markAsRead da shu chatdagi barcha isRead: false xabarlar true bo'ladi


🔔 NOTIFICATIONS MODULE
Endpointlar:
GET   /notifications          → O'z bildirishnomalarim [JWT] (pagination)
PATCH /notifications/:id/read → O'qildi deb belgilash
PATCH /notifications/read-all → Barchasini o'qildi
DELETE /notifications/:id     → O'chirish
NotificationsService ichida:
typescript// Boshqa service lar import qilib ishlatadi
async sendNotification(userId, title, body, type, data?)
  // 1. DB ga saqlaydi
  // 2. Agar fcmToken bo'lsa Firebase ga yuboradi

📁 UPLOAD MODULE
Endpointlar:
POST /upload/image       → Bitta rasm [JWT]
POST /upload/images      → Ko'p rasm (max 5) [JWT]
DELETE /upload/:publicId → Rasmni o'chirish [JWT]
Logika:

Faqat image/jpeg, image/png, image/webp qabul qiladi
Max fayl hajmi: 5MB
Cloudinary avtoehtiyot/requests folderiga yuklaydi
Response: { url, publicId }


🗺️ REGIONS MODULE
GET  /regions          → Barcha hududlar
POST /regions          → Qo'shish [ADMIN only]

🛡️ ADMIN MODULE
Endpointlar:
GET    /admin/users              → Barcha foydalanuvchilar (filter, pagination)
PATCH  /admin/users/:id/block    → Bloklash/Blokdan chiqarish
DELETE /admin/users/:id          → O'chirish

GET    /admin/shops              → Barcha do'konlar
PATCH  /admin/shops/:id/verify   → Tasdiqlash/Bekor qilish

GET    /admin/requests           → Barcha so'rovlar
GET    /admin/stats              → Statistika (jami users, shops, requests, offers)

POST   /admin/notifications/broadcast → Hammaga notification yuborish

🔒 COMMON — Guards, Decorators, Interceptors
Guards:
typescript// jwt-auth.guard.ts — Har doim JWT tekshiradi
// roles.guard.ts    — @Roles(Role.ADMIN) dekorator bilan ishlaydi
// ws-jwt.guard.ts   — WebSocket uchun JWT

// Ishlatish:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
Decorators:
typescript// current-user.decorator.ts
@CurrentUser() user: User   // Request dan user ni oladi

// roles.decorator.ts
@Roles(Role.ADMIN, Role.SHOP)
Response Interceptor:
typescript// Barcha response shu formatda bo'lsin:
{
  success: true,
  data: { ... },
  message: "OK"
}

// Xato bo'lganda:
{
  success: false,
  error: "Not Found",
  statusCode: 404
}

⚙️ MAIN.TS KONFIGURATSIYA
typescript// main.ts da bular bo'lsin:
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
app.useGlobalInterceptors(new ResponseInterceptor())
app.useGlobalFilters(new AllExceptionsFilter())
app.enableCors({ origin: '*' })
app.setGlobalPrefix('api/v1')

// Swagger
SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))

// Port: process.env.PORT || 3000

🌱 PRISMA SEED
prisma/seed.ts da quyidagilarni yaratsin:
- 14 ta Regions (O'zbekiston viloyatlari)
- 1 ta Admin user (phone: +998901234567, password: Admin123!)
- 2 ta test DRIVER
- 2 ta test SHOP (do'kon bilan birga)
- 5 ta test Request
- 10 ta test Offer

📝 QO'SHIMCHA TALABLAR

Har bir faylda to'liq ishlaydigan kod bo'lsin, stub/placeholder YO'Q
Swagger decoratorlari barcha controllerlarda bo'lsin
Error handling — try/catch yoki NestJS exception filter
Ownership tekshiruvi — har bir PATCH/DELETE da foydalanuvchi o'z resursini boshqarayotganini tekshir
Prisma transactions — bir nechta DB operatsiyasi bitta tranzaksiyada bo'lsin (masalan offer accept)
Environment variables — hamma maxfiy ma'lumot .env dan olinsin
package.json script:

json"scripts": {
  "start:dev": "nest start --watch",
  "db:migrate": "prisma migrate dev",
  "db:seed": "ts-node prisma/seed.ts",
  "db:studio": "prisma studio"
}

🚀 BOSHLASH TARTIBI
Kodni shu ketma-ketlikda yoz:

prisma.service.ts va prisma.module.ts
common/ — guards, decorators, interceptors, filters
auth/ — to'liq
users/ — to'liq
upload/ — Cloudinary service
regions/ — sodda CRUD
shops/ — geolokatsiya bilan
requests/ — rasm upload bilan
notifications/ — FCM + DB service
offers/ — murakkab logika (tranzaksiya)
chat/ — WebSocket gateway
admin/ — barcha admin endpointlar
app.module.ts — hamma modulni import
main.ts — konfiguratsiya
prisma/seed.ts — test ma'lumotlar


Har bir modul uchun alohida "Tayyor" de va keyingisiga o'tishimni kut.
Birinchidan prisma.service.ts ni yozishni boshlaylik.