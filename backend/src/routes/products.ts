import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { getInventoryStatus } from "../services/cartService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

const include = { category: true, inventory: true } as const;

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = String(req.query.search ?? "");
    const categoryId = String(req.query.categoryId ?? "");
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } }
              ]
            }
          : {}),
        ...(categoryId ? { categoryId } : {})
      },
      include,
      orderBy: { name: "asc" }
    });
    ok(res, products);
  })
);

router.get(
  "/barcode/:barcode",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { barcode: req.params.barcode }, include });
    if (!product || !product.isActive) throw new HttpError(404, "Product not found");
    ok(res, product);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include });
    if (!product || !product.isActive) throw new HttpError(404, "Product not found");
    ok(res, product);
  })
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string(),
        barcode: z.string(),
        description: z.string().default(""),
        categoryId: z.string(),
        price: z.number().positive(),
        mrp: z.number().positive(),
        weightKg: z.number().positive(),
        imageUrl: z.string().url(),
        supplier: z.string(),
        stock: z.number().int().nonnegative(),
        minStock: z.number().int().positive().default(50)
      })
      .parse(req.body);

    const status = getInventoryStatus(body.stock, body.minStock);
    const product = await prisma.product.create({
      data: {
        name: body.name,
        barcode: body.barcode,
        description: body.description,
        categoryId: body.categoryId,
        price: body.price,
        mrp: body.mrp,
        weightKg: body.weightKg,
        imageUrl: body.imageUrl,
        supplier: body.supplier,
        status,
        inventory: {
          create: {
            stock: body.stock,
            minStock: body.minStock,
            status
          }
        }
      },
      include
    });
    ok(res, product, 201);
  })
);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        price: z.number().positive().optional(),
        mrp: z.number().positive().optional(),
        weightKg: z.number().positive().optional(),
        imageUrl: z.string().url().optional(),
        supplier: z.string().optional(),
        stock: z.number().int().nonnegative().optional(),
        minStock: z.number().int().positive().optional()
      })
      .parse(req.body);

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        price: body.price,
        mrp: body.mrp,
        weightKg: body.weightKg,
        imageUrl: body.imageUrl,
        supplier: body.supplier
      },
      include
    });

    if (body.stock !== undefined || body.minStock !== undefined) {
      const minStock = body.minStock ?? product.inventory?.minStock ?? 50;
      const stock = body.stock ?? product.inventory?.stock ?? 0;
      const status = getInventoryStatus(stock, minStock);
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: { stock, minStock, status },
        create: { productId: product.id, stock, minStock, status }
      });
      await prisma.product.update({ where: { id: product.id }, data: { status } });
    }

    ok(res, await prisma.product.findUnique({ where: { id: product.id }, include }));
  })
);

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false, status: "INACTIVE" },
      include
    });
    ok(res, product);
  })
);

export default router;
