import { PrismaClient, Role, RequestStatus, OfferStatus, Condition } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL topilmadi");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding boshlandi...\n');

  // ─── 1. REGIONS (14 ta O'zbekiston viloyatlari) ────────────────────
  const regionNames = [
    'Toshkent shahri',
    'Toshkent viloyati',
    'Samarqand',
    'Buxoro',
    'Farg\'ona',
    'Andijon',
    'Namangan',
    'Qashqadaryo',
    'Surxondaryo',
    'Jizzax',
    'Sirdaryo',
    'Navoiy',
    'Xorazm',
    'Qoraqalpog\'iston',
  ];

  const regions: any[] = [];
  for (const name of regionNames) {
    const region = await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    regions.push(region);
  }
  console.log(`✅ ${regions.length} ta viloyat yaratildi`);

  // ─── 2. ADMIN USER ─────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '+998901234567' },
    update: {},
    create: {
      fullName: 'Super Admin',
      phoneNumber: '+998901234567',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      isBlocked: false,
    },
  });
  console.log(`✅ Admin yaratildi: ${admin.phoneNumber}`);

  // ─── 3. TEST DRIVERS ───────────────────────────────────────────────
  const driverPassword = await bcrypt.hash('Driver123!', 10);
  const driver1 = await prisma.user.upsert({
    where: { phoneNumber: '+998901111111' },
    update: {},
    create: {
      fullName: 'Alisher Karimov',
      phoneNumber: '+998901111111',
      password: driverPassword,
      role: Role.DRIVER,
    },
  });
  const driver2 = await prisma.user.upsert({
    where: { phoneNumber: '+998902222222' },
    update: {},
    create: {
      fullName: 'Bobur Rahimov',
      phoneNumber: '+998902222222',
      password: driverPassword,
      role: Role.DRIVER,
    },
  });
  console.log(`✅ 2 ta Driver yaratildi`);

  // ─── 4. TEST SHOPS (owner + shop) ─────────────────────────────────
  const shopPassword = await bcrypt.hash('Shop123!', 10);

  const shopOwner1 = await prisma.user.upsert({
    where: { phoneNumber: '+998903333333' },
    update: {},
    create: {
      fullName: 'Sarvar Toshmatov',
      phoneNumber: '+998903333333',
      password: shopPassword,
      role: Role.SHOP,
    },
  });
  const shopOwner2 = await prisma.user.upsert({
    where: { phoneNumber: '+998904444444' },
    update: {},
    create: {
      fullName: 'Jasur Nazarov',
      phoneNumber: '+998904444444',
      password: shopPassword,
      role: Role.SHOP,
    },
  });

  // Do'konlar yaratish
  const shop1 = await prisma.shop.upsert({
    where: { ownerId: shopOwner1.id },
    update: {},
    create: {
      name: 'Avto Zapchast Plus',
      description: 'Barcha rusumli avtomobillar uchun original va analog ehtiyot qismlar',
      address: 'Toshkent, Yunusobod tumani, 7-mavze',
      lat: 41.3375,
      lng: 69.3086,
      phoneNumber: '+998903333333',
      workingHours: '09:00 - 19:00',
      telegram: '@avtozapchastoplus',
      categories: ['Dvigatel', 'Tormoz tizimi', 'Elektr tizim'],
      brands: ['Chevrolet', 'Nexia', 'Cobalt', 'Toyota'],
      rating: 4.8,
      reviewCount: 24,
      isVerified: true,
      ownerId: shopOwner1.id,
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { ownerId: shopOwner2.id },
    update: {},
    create: {
      name: 'Moto Zapchast',
      description: 'Koreys va Yapon avtomobillari uchun ehtiyot qismlar. Kafolat bilan',
      address: 'Toshkent, Chilonzor tumani, Bunyodkor shoh ko\'chasi',
      lat: 41.2995,
      lng: 69.2401,
      phoneNumber: '+998904444444',
      workingHours: '08:00 - 20:00',
      telegram: '@motozapchast',
      categories: ['Moy filtri', 'Havo filtri', 'Amortizator'],
      brands: ['Hyundai', 'Kia', 'Honda', 'Daewoo'],
      rating: 4.5,
      reviewCount: 11,
      isVerified: true,
      ownerId: shopOwner2.id,
    },
  });
  console.log(`✅ 2 ta Shop yaratildi`);

  // ─── 5. TEST REQUESTS (5 ta) ──────────────────────────────────────
  const expiresAt3Days = new Date();
  expiresAt3Days.setDate(expiresAt3Days.getDate() + 3);

  const request1 = await prisma.request.create({
    data: {
      carModel: 'Chevrolet Cobalt',
      carYear: 2021,
      carBody: 'Sedan',
      partName: 'Old tormoz kolodkasi',
      description: 'Old g\'ildiraklar uchun tormoz kolodkasi kerak. Original bo\'lsin.',
      regionId: regions[0].id,
      driverId: driver1.id,
      expiresAt: expiresAt3Days,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' },
        ],
      },
    },
  });

  const request2 = await prisma.request.create({
    data: {
      carModel: 'Nexia 3',
      carYear: 2019,
      partName: 'Dvigatel moy filtri',
      partNumber: 'OK87E-14302',
      description: 'Original Daewoo marka bo\'lsa afzal',
      regionId: regions[0].id,
      driverId: driver1.id,
      expiresAt: expiresAt3Days,
    },
  });

  const request3 = await prisma.request.create({
    data: {
      carModel: 'Toyota Camry',
      carYear: 2020,
      vinCode: 'JT2BF22K1Y0273685',
      partName: 'Amortizator (orqa)',
      description: 'Ikki dona kerak, original yoki original sifatli analog',
      regionId: regions[2].id,
      driverId: driver2.id,
      expiresAt: expiresAt3Days,
    },
  });

  const request4 = await prisma.request.create({
    data: {
      carModel: 'Chevrolet Spark',
      carYear: 2018,
      partName: 'Havo filtri',
      description: 'Kunlik foydalanish uchun kerak',
      regionId: regions[1].id,
      driverId: driver2.id,
      expiresAt: expiresAt3Days,
    },
  });

  const request5 = await prisma.request.create({
    data: {
      carModel: 'Hyundai Sonata',
      carYear: 2022,
      partName: 'Akumulyator (batareya)',
      partNumber: '37110-3Q200',
      description: '12V 70Ah yoki analogini topib bering',
      regionId: regions[0].id,
      driverId: driver1.id,
      expiresAt: expiresAt3Days,
    },
  });
  console.log(`✅ 5 ta Request yaratildi`);

  // ─── 6. TEST OFFERS (10 ta) ────────────────────────────────────────
  // Request 1 ga 2 ta offer (shop1 va shop2)
  const offer1 = await prisma.offer.create({
    data: {
      price: 85000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: true,
      deliveryTime: '1 kun ichida',
      comment: 'Original Brembo kolodkasi mavjud',
      warranty: '6 oy kafolat',
      requestId: request1.id,
      shopId: shop1.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request1.id, offerId: offer1.id },
  });

  const offer2 = await prisma.offer.create({
    data: {
      price: 72000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: false,
      comment: 'Analog, sifatli Xitoy istehsoli',
      warranty: '3 oy',
      requestId: request1.id,
      shopId: shop2.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request1.id, offerId: offer2.id },
  });

  // Request 2 ga 2 ta offer
  const offer3 = await prisma.offer.create({
    data: {
      price: 35000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: true,
      deliveryTime: 'Bugun',
      comment: 'Original filtr mavjud',
      requestId: request2.id,
      shopId: shop1.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request2.id, offerId: offer3.id },
  });

  const offer4 = await prisma.offer.create({
    data: {
      price: 28000,
      currency: 'UZS',
      condition: Condition.NEW,
      comment: 'Ertaga tayyor',
      requestId: request2.id,
      shopId: shop2.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request2.id, offerId: offer4.id },
  });

  // Request 3 ga 2 ta offer
  const offer5 = await prisma.offer.create({
    data: {
      price: 320000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: true,
      deliveryTime: '2-3 kun',
      warranty: '1 yil',
      requestId: request3.id,
      shopId: shop1.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request3.id, offerId: offer5.id },
  });

  const offer6 = await prisma.offer.create({
    data: {
      price: 290000,
      currency: 'UZS',
      condition: Condition.REFURBISHED,
      comment: 'Yaponiya import, sifatli',
      requestId: request3.id,
      shopId: shop2.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request3.id, offerId: offer6.id },
  });

  // Request 4 ga 2 ta offer
  const offer7 = await prisma.offer.create({
    data: {
      price: 18000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: true,
      requestId: request4.id,
      shopId: shop1.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request4.id, offerId: offer7.id },
  });

  const offer8 = await prisma.offer.create({
    data: {
      price: 15000,
      currency: 'UZS',
      condition: Condition.NEW,
      requestId: request4.id,
      shopId: shop2.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request4.id, offerId: offer8.id },
  });

  // Request 5 ga 2 ta offer
  const offer9 = await prisma.offer.create({
    data: {
      price: 420000,
      currency: 'UZS',
      condition: Condition.NEW,
      delivery: true,
      deliveryTime: '1 kun',
      warranty: '1 yil kafolat',
      comment: 'Koreya original akumulyator',
      requestId: request5.id,
      shopId: shop1.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request5.id, offerId: offer9.id },
  });

  const offer10 = await prisma.offer.create({
    data: {
      price: 380000,
      currency: 'UZS',
      condition: Condition.NEW,
      warranty: '6 oy',
      comment: 'Xitoy analog, lekin sifatli',
      requestId: request5.id,
      shopId: shop2.id,
    },
  });
  await prisma.chat.create({
    data: { requestId: request5.id, offerId: offer10.id },
  });

  console.log(`✅ 10 ta Offer va 10 ta Chat yaratildi`);

  // Request 1 statusini IN_PROGRESS ga o'tkazamiz (offerlar kelgani uchun)
  await prisma.request.updateMany({
    where: { id: { in: [request1.id, request2.id, request3.id, request4.id, request5.id] } },
    data: { status: RequestStatus.IN_PROGRESS },
  });

  console.log('\n🎉 Seeding muvaffaqiyatli yakunlandi!');
  console.log('─'.repeat(50));
  console.log('📊 Yaratilgan ma\'lumotlar:');
  console.log(`   • ${regions.length} ta Viloyat`);
  console.log(`   • 1 ta Admin (tel: +998901234567, parol: Admin123!)`);
  console.log(`   • 2 ta Driver (tel: +99890111..., parol: Driver123!)`);
  console.log(`   • 2 ta Shop (tel: +99890333..., parol: Shop123!)`);
  console.log(`   • 5 ta Request`);
  console.log(`   • 10 ta Offer + 10 ta Chat`);
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seeding xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
