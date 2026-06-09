import bcrypt from "bcryptjs";
import { PrismaClient, ProductStatus, FraudType, RiskLevel, FraudStatus } from "@prisma/client";

const prisma = new PrismaClient();

const productImages = {
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
  eggs: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
  butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80",
  tea: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80",
  honey: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
  biscuits: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
  curd: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
  sauce: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
  stationery: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
};

async function main() {
  const store = await prisma.store.upsert({
    where: { code: "mumbai-vile-parle" },
    update: {},
    create: {
      code: "mumbai-vile-parle",
      name: "Smart Supermarket",
      city: "Mumbai",
      area: "Vile Parle",
      address: "Station Road, Vile Parle East, Mumbai, Maharashtra"
    }
  });

  const admin = await prisma.admin.upsert({
    where: { email: "admin@smartcart.local" },
    update: {},
    create: {
      name: "Priya Singh",
      email: "admin@smartcart.local",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "STORE_MANAGER",
      storeId: store.id
    }
  });

  const user = await prisma.user.upsert({
    where: { mobile: "9876543210" },
    update: {},
    create: {
      name: "Raj Kumar",
      mobile: "9876543210",
      email: "raj@gmail.com",
      loyaltyPoints: 240
    }
  });

  const categories = await Promise.all(
    [
      ["Dairy", "🥛"],
      ["Bakery", "🍞"],
      ["Grains", "🌾"],
      ["Oils", "🛢️"],
      ["Beverages", "🍵"],
      ["Foods", "🍯"],
      ["Biscuits", "🍪"],
      ["Sauces & Spreads", "🥫"],
      ["Biscuits & Cookies", "🍪"],
      ["Office & Stationery", "📎"]
    ].map(([name, emoji]) =>
      prisma.category.upsert({
        where: { name },
        update: { emoji },
        create: { name, emoji }
      })
    )
  );

  const byName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const products = [
    {
      name: "PATANJALI DOODH MILK BISCUITS",
      barcode: "8906032018513",
      category: "Biscuits",
      price: 5,
      mrp: 5,
      weightKg: 0.035,
      imageUrl: productImages.biscuits,
      supplier: "Patanjali Foods",
      stock: 90,
      description: "35g Patanjali Doodh Milk Biscuits pack for scan-and-shop checkout."
    },
    {
      name: "Priya Premium Curd 1kg",
      barcode: "8906077890012",
      category: "Dairy",
      price: 80,
      mrp: 80,
      weightKg: 1,
      imageUrl: productImages.curd,
      supplier: "Priya Dairy",
      stock: 80,
      description: "Fresh and creamy Priya curd, 1kg pack. SKU: PRIYA-CURD-1KG."
    },
    {
      name: "Xinng Continental Sauce 500g",
      barcode: "8906123456789",
      category: "Sauces & Spreads",
      price: 65,
      mrp: 65,
      weightKg: 0.5,
      imageUrl: productImages.sauce,
      supplier: "Xinng Foods",
      stock: 75,
      description: "Tangy and spicy continental sauce, 500g bottle. SKU: XINNG-CONT-SAUCE-500G."
    },
    {
      name: "Britannia Marie Gold Biscuit 120g",
      barcode: "8901063061302",
      category: "Biscuits & Cookies",
      price: 15,
      mrp: 15,
      weightKg: 0.12,
      imageUrl: productImages.biscuits,
      supplier: "Britannia Industries",
      stock: 120,
      description: "Crispy and light tea-time biscuit, 120g pack. SKU: BRIT-MARIEGOLD-120G."
    },
    {
      name: "Fevicol MR General Purpose 100ml",
      barcode: "8901030720015",
      category: "Office & Stationery",
      price: 45,
      mrp: 45,
      weightKg: 0.1,
      imageUrl: productImages.stationery,
      supplier: "Pidilite Industries",
      stock: 65,
      description: "Multi-purpose adhesive for school, office, and craft use. SKU: FEVICOL-MR-100ML."
    },
    {
      name: "Brown Bread",
      barcode: "8901030890617",
      category: "Bakery",
      price: 45,
      mrp: 50,
      weightKg: 0.4,
      imageUrl: productImages.bread,
      supplier: "Mumbai Bakers",
      stock: 156,
      description: "Fresh whole wheat brown bread baked daily."
    },
    {
      name: "Milk (Amul 500ml)",
      barcode: "8901063150853",
      category: "Dairy",
      price: 55,
      mrp: 58,
      weightKg: 0.53,
      imageUrl: productImages.milk,
      supplier: "Amul Dairy",
      stock: 38,
      description: "Pasteurised toned milk, 500ml pouch."
    },
    {
      name: "Eggs (10-pack)",
      barcode: "8901030890618",
      category: "Dairy",
      price: 65,
      mrp: 70,
      weightKg: 0.6,
      imageUrl: productImages.eggs,
      supplier: "Happy Farms",
      stock: 12,
      description: "Farm fresh white eggs, pack of ten."
    },
    {
      name: "Basmati Rice (1kg)",
      barcode: "8901063150854",
      category: "Grains",
      price: 150,
      mrp: 165,
      weightKg: 1,
      imageUrl: productImages.rice,
      supplier: "Hyderabad Grains Co",
      stock: 498,
      description: "Long grain basmati rice sourced from Telangana."
    },
    {
      name: "Refined Oil (1L)",
      barcode: "8901063150855",
      category: "Oils",
      price: 95,
      mrp: 105,
      weightKg: 0.92,
      imageUrl: productImages.oil,
      supplier: "ABC Oils Ltd",
      stock: 42,
      description: "Light refined sunflower oil for everyday cooking."
    },
    {
      name: "Butter (200g)",
      barcode: "8901063150856",
      category: "Dairy",
      price: 120,
      mrp: 130,
      weightKg: 0.2,
      imageUrl: productImages.butter,
      supplier: "Amul Dairy",
      stock: 87,
      description: "Creamy salted butter, perfect with bread."
    },
    {
      name: "Tea (500g)",
      barcode: "8901063150857",
      category: "Beverages",
      price: 85,
      mrp: 95,
      weightKg: 0.5,
      imageUrl: productImages.tea,
      supplier: "Nilgiri Tea Co",
      stock: 234,
      description: "Strong Indian tea blend for milk tea."
    },
    {
      name: "Honey (500ml)",
      barcode: "8901063150858",
      category: "Foods",
      price: 180,
      mrp: 210,
      weightKg: 0.7,
      imageUrl: productImages.honey,
      supplier: "Deccan Naturals",
      stock: 5,
      description: "Natural forest honey with no added sugar."
    }
  ];

  for (const item of products) {
    const status = item.stock <= 0 ? ProductStatus.OUT_OF_STOCK : item.stock < 50 ? ProductStatus.LOW_STOCK : ProductStatus.ACTIVE;
    const product = await prisma.product.upsert({
      where: { barcode: item.barcode },
      update: {
        name: item.name,
        description: item.description,
        categoryId: byName[item.category].id,
        price: item.price,
        mrp: item.mrp,
        weightKg: item.weightKg,
        imageUrl: item.imageUrl,
        supplier: item.supplier,
        status
      },
      create: {
        name: item.name,
        barcode: item.barcode,
        description: item.description,
        categoryId: byName[item.category].id,
        price: item.price,
        mrp: item.mrp,
        weightKg: item.weightKg,
        imageUrl: item.imageUrl,
        supplier: item.supplier,
        status
      }
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { stock: item.stock, minStock: 50, status },
      create: { productId: product.id, stock: item.stock, minStock: 50, status }
    });
  }

  const seededFraudTitle = "Cart #5892 — Weight mismatch 45%";
  const existingFraudEvent = await prisma.fraudEvent.findFirst({
    where: { userId: user.id, title: seededFraudTitle }
  });

  if (!existingFraudEvent) {
    await prisma.fraudEvent.create({
      data: {
        userId: user.id,
        type: FraudType.WEIGHT_MISMATCH,
        risk: RiskLevel.HIGH,
        status: FraudStatus.ACTIVE,
        title: seededFraudTitle,
        description: "Expected 3.87kg, actual 5.20kg. Possible unscanned item.",
        expectedWeightKg: 3.87,
        actualWeightKg: 5.2,
        variancePercent: 34.37,
        metadata: { store: store.code, customer: "Raj Kumar", time: "08:53 AM" }
      }
    });
  }

  console.log(`Seeded ${store.name}, admin ${admin.email}, demo user ${user.mobile}, and ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
