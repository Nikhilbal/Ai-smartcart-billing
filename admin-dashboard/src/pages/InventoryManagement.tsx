import { AlertCircle, Edit3, ImagePlus, PackagePlus, Percent, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input } from "../components/ui";
import { products as initialProducts, productImages, Product } from "../data/mock";
import { api } from "../lib/api";
import { cn, inr } from "../lib/utils";

type ApiProduct = {
  id: string;
  name: string;
  barcode: string;
  description?: string | null;
  sku?: string | null;
  price: number | string;
  mrp: number | string;
  discount?: number | string;
  gstRate?: number | string;
  gstMode?: "INCLUSIVE" | "EXCLUSIVE";
  weightKg: number | string;
  imageUrl: string;
  supplier: string;
  supplierPhone?: string | null;
  category?: { name: string } | null;
  inventory?: { stock: number; minStock: number } | null;
};

function statusFor(stock: number, min: number): Product["status"] {
  if (stock < Math.max(15, Math.floor(min * 0.3))) return "CRITICAL";
  if (stock < min) return "LOW";
  return "OK";
}

function statusTone(status: Product["status"]) {
  if (status === "OK") return "bg-emerald-50 text-success";
  if (status === "LOW") return "bg-yellow-50 text-warning";
  return "bg-red-50 text-danger";
}

function mapApiProduct(product: ApiProduct): Product {
  const stock = product.inventory?.stock ?? 0;
  const min = product.inventory?.minStock ?? 50;
  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    category: product.category?.name ?? "Uncategorized",
    price: Number(product.price),
    mrp: Number(product.mrp),
    discount: Number(product.discount ?? 0),
    gstRate: Number(product.gstRate ?? 5),
    gstMode: product.gstMode ?? "EXCLUSIVE",
    weightKg: Number(product.weightKg),
    stock,
    min,
    status: statusFor(stock, min),
    supplier: product.supplier,
    supplierPhone: product.supplierPhone ?? "",
    image: product.imageUrl,
    sku: product.sku ?? undefined,
    description: product.description ?? ""
  };
}

function blankProduct(): Product {
  return {
    id: "new",
    name: "",
    barcode: "",
    category: "Biscuits",
    price: 0,
    mrp: 0,
    discount: 0,
    gstRate: 5,
    gstMode: "INCLUSIVE",
    weightKg: 0.035,
    stock: 0,
    min: 50,
    status: "OK",
    supplier: "",
    supplierPhone: "",
    image: productImages.biscuits,
    sku: "",
    description: ""
  };
}

function withDefaults(product: Product): Product {
  return {
    ...blankProduct(),
    ...product,
    mrp: product.mrp ?? product.price,
    discount: product.discount ?? Math.max(0, (product.mrp ?? product.price) - product.price),
    gstRate: product.gstRate ?? 5,
    gstMode: product.gstMode ?? "INCLUSIVE",
    weightKg: product.weightKg ?? 0.1,
    supplierPhone: product.supplierPhone ?? "",
    description: product.description ?? "",
    image: product.image || productImages.biscuits
  };
}

function buildPayload(product: Product) {
  const clean = withDefaults(product);
  return {
    name: clean.name.trim(),
    barcode: clean.barcode.trim(),
    description: clean.description ?? "",
    sku: clean.sku?.trim() || undefined,
    categoryName: clean.category.trim(),
    price: Number(clean.price),
    mrp: Number(clean.mrp),
    discount: Number(clean.discount ?? 0),
    gstRate: Number(clean.gstRate ?? 0),
    gstMode: clean.gstMode ?? "INCLUSIVE",
    weightKg: Number(clean.weightKg ?? 0.1),
    imageUrl: clean.image || productImages.biscuits,
    supplier: clean.supplier.trim(),
    supplierPhone: clean.supplierPhone?.trim() ?? "",
    stock: Math.max(0, Number(clean.stock)),
    minStock: Math.max(1, Number(clean.min))
  };
}

export function InventoryManagement({ onReorder }: { onReorder: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>(initialProducts.map(withDefaults));
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [connected, setConnected] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let mounted = true;
    api
      .get("/products")
      .then(({ data }) => {
        if (!mounted) return;
        setProducts((data.data as ApiProduct[]).map(mapApiProduct));
        setConnected("online");
      })
      .catch(() => {
        if (!mounted) return;
        setConnected("offline");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () => products.filter((product) => `${product.name} ${product.barcode} ${product.sku ?? ""} ${product.category} ${product.supplier}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const lowStockCount = products.filter((product) => product.stock < product.min).length;
  const stockValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);

  function updateLocal(next: Product) {
    setProducts((items) => (next.id === "new" ? [{ ...next, id: `local-${Date.now()}` }, ...items] : items.map((item) => (item.id === next.id ? next : item))));
  }

  async function saveProduct(next: Product) {
    const normalized = withDefaults({ ...next, status: statusFor(next.stock, next.min) });
    if (!normalized.name || !normalized.barcode || !normalized.category || !normalized.supplier) {
      window.alert("Please enter product name, barcode, category, and supplier.");
      return;
    }

    if (connected === "online") {
      try {
        const payload = buildPayload(normalized);
        const { data } =
          normalized.id === "new" || normalized.id.startsWith("local-")
            ? await api.post("/products", payload)
            : await api.put(`/products/${normalized.id}`, payload);
        const saved = mapApiProduct(data.data as ApiProduct);
        setProducts((items) => (normalized.id === "new" || normalized.id.startsWith("local-") ? [saved, ...items] : items.map((item) => (item.id === saved.id ? saved : item))));
        setEditing(null);
        return;
      } catch {
        setConnected("offline");
      }
    }

    updateLocal(normalized);
    setEditing(null);
  }

  async function restock(product: Product) {
    const nextStock = product.stock + 100;
    const next = { ...product, stock: nextStock, status: statusFor(nextStock, product.min) };
    setProducts((items) => items.map((item) => (item.id === product.id ? next : item)));
    if (connected === "online" && !product.id.startsWith("local-")) {
      try {
        await api.put(`/inventory/${product.id}`, { stock: nextStock, minStock: product.min });
      } catch {
        setConnected("offline");
      }
    }
  }

  async function remove(product: Product) {
    setProducts((items) => items.filter((item) => item.id !== product.id));
    if (connected === "online" && !product.id.startsWith("local-")) {
      try {
        await api.delete(`/products/${product.id}`);
      } catch {
        setConnected("offline");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-4">
          <Badge className="bg-blue-50 px-5 py-3 text-base text-brand">{products.length} Total Items</Badge>
          <Badge className="bg-red-50 px-5 py-3 text-base text-danger">{lowStockCount} Low Stock</Badge>
          <Badge className="bg-emerald-50 px-5 py-3 text-base text-success">Stock Value: {inr(stockValue)}</Badge>
          <Badge className={connected === "online" ? "bg-emerald-50 px-5 py-3 text-base text-success" : "bg-amber-50 px-5 py-3 text-base text-warning"}>
            {connected === "online" ? "Backend Connected" : connected === "checking" ? "Checking Backend" : "Offline Demo Mode"}
          </Badge>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative w-full min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input className="pl-12" placeholder="Search inventory, barcode, supplier" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Button onClick={() => setEditing(blankProduct())} className="bg-brand px-5 text-white">
            <Plus size={18} /> Add Inventory Item
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1280px] table-fixed text-left">
            <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
              <tr>
                <th className="w-[28%] px-6 py-5">Product</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Pricing</th>
                <th className="px-6 py-5">GST</th>
                <th className="px-6 py-5">Stock</th>
                <th className="w-[18%] px-6 py-5">Supplier</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/70">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
                      <div>
                        <div className="text-lg font-extrabold">{product.name}</div>
                        <div className="mt-1 font-mono text-sm text-gray-400">{product.barcode}</div>
                        {product.sku ? <div className="mt-1 font-mono text-xs font-bold text-gray-400">SKU {product.sku}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5"><Badge className="bg-gray-100 text-gray-600">{product.category}</Badge></td>
                  <td className="px-6 py-5">
                    <div className="text-lg font-extrabold text-brand">{inr(product.price)}</div>
                    <div className="text-sm font-bold text-gray-400">MRP {inr(product.mrp ?? product.price)}</div>
                    {(product.discount ?? 0) > 0 ? <div className="mt-1 flex items-center gap-1 text-xs font-black text-success"><Percent size={13} /> {inr(product.discount ?? 0)} off</div> : null}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold">{product.gstRate ?? 0}%</div>
                    <div className="text-xs font-black text-gray-400">{product.gstMode ?? "INCLUSIVE"}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-mono text-lg font-black">{product.stock}</div>
                    <div className="text-sm font-semibold text-gray-400">min: {product.min}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-700">{product.supplier}</div>
                    <div className="mt-1 font-mono text-xs font-bold text-gray-400">{product.supplierPhone || "No number"}</div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={cn(statusTone(product.status), "text-sm")}>
                      <span className={cn("mr-2 h-3 w-3 rounded-full", product.status === "OK" ? "bg-green-500" : product.status === "LOW" ? "bg-yellow-400" : "bg-red-500")} />
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <Button onClick={() => setEditing(withDefaults(product))} className="bg-blue-50 p-3 text-brand"><Edit3 size={18} /></Button>
                      {product.stock < product.min ? <Button onClick={() => onReorder(product)} className="bg-orange-50 p-3 text-warning"><PackagePlus size={18} /></Button> : null}
                      <Button onClick={() => restock(product)} className="bg-emerald-50 p-3 text-success"><RefreshCw size={18} /></Button>
                      <Button onClick={() => remove(product)} className="bg-red-50 p-3 text-danger"><Trash2 size={18} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <ProductForm product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function ProductForm({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (product: Product) => void }) {
  const [draft, setDraft] = useState(withDefaults(product));

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectPreviewImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    update("image", URL.createObjectURL(file));
  }

  const status = statusFor(Number(draft.stock), Number(draft.min));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/30 p-4 backdrop-blur-sm">
      <Card className="my-6 w-full max-w-5xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-extrabold">{product.id === "new" ? "Add Inventory Item" : "Edit Inventory Item"}</h2>
            <p className="mt-1 text-sm font-bold text-gray-500">Manual catalog entry for products, pricing, GST, supplier, and stock.</p>
          </div>
          <Badge className={cn(statusTone(status), "text-sm")}>{status}</Badge>
        </div>

        <div className="grid max-h-[72vh] gap-6 overflow-y-auto p-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-border bg-gray-50">
              <img src={draft.image || productImages.biscuits} alt={draft.name || "Product preview"} className="h-64 w-full object-cover" />
            </div>
            <Field label="Product image URL">
              <Input value={draft.image} onChange={(event) => update("image", event.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Choose image preview">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4 text-sm font-extrabold text-brand">
                <ImagePlus size={19} /> Upload / Preview
                <input type="file" accept="image/*" className="hidden" onChange={selectPreviewImage} />
              </label>
            </Field>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              <div className="flex gap-2"><AlertCircle size={18} /> For deployed apps, use a public image URL or object storage link.</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product name">
                <Input value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="PATANJALI DOODH MILK BISCUITS" />
              </Field>
              <Field label="Barcode number">
                <Input value={draft.barcode} onChange={(event) => update("barcode", event.target.value)} placeholder="8906032018513" />
              </Field>
              <Field label="Category">
                <Input value={draft.category} onChange={(event) => update("category", event.target.value)} placeholder="Biscuits" />
              </Field>
              <Field label="SKU / internal code">
                <Input value={draft.sku ?? ""} onChange={(event) => update("sku", event.target.value)} placeholder="Optional SKU" />
              </Field>
              <Field label="Gross / net weight in kg">
                <Input type="number" step="0.001" min="0" value={draft.weightKg} onChange={(event) => update("weightKg", Number(event.target.value))} />
              </Field>
              <Field label="Quantity to add">
                <Input type="number" min="0" value={draft.stock} onChange={(event) => update("stock", Number(event.target.value))} />
              </Field>
              <Field label="Minimum stock alert">
                <Input type="number" min="1" value={draft.min} onChange={(event) => update("min", Number(event.target.value))} />
              </Field>
              <Field label="Supplier name">
                <Input value={draft.supplier} onChange={(event) => update("supplier", event.target.value)} placeholder="Patanjali Foods" />
              </Field>
              <Field label="Supplier phone number">
                <Input value={draft.supplierPhone ?? ""} onChange={(event) => update("supplierPhone", event.target.value)} placeholder="+91 98765 43210" />
              </Field>
            </div>

            <div className="rounded-[22px] border border-border bg-gray-50 p-5">
              <div className="mb-4 text-lg font-extrabold">Pricing & Tax</div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="MRP">
                  <Input type="number" min="0" value={draft.mrp} onChange={(event) => update("mrp", Number(event.target.value))} />
                </Field>
                <Field label="Selling price">
                  <Input type="number" min="0" value={draft.price} onChange={(event) => update("price", Number(event.target.value))} />
                </Field>
                <Field label="Discount amount (optional)">
                  <Input type="number" min="0" value={draft.discount ?? 0} onChange={(event) => update("discount", Number(event.target.value))} />
                </Field>
                <Field label="GST rate (%)">
                  <Input type="number" min="0" value={draft.gstRate ?? 0} onChange={(event) => update("gstRate", Number(event.target.value))} />
                </Field>
                <Field label="GST calculation">
                  <select
                    value={draft.gstMode ?? "INCLUSIVE"}
                    onChange={(event) => update("gstMode", event.target.value as Product["gstMode"])}
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold outline-none ring-brand/20 transition focus:ring-4"
                  >
                    <option value="INCLUSIVE">GST included in selling price</option>
                    <option value="EXCLUSIVE">GST added above selling price</option>
                  </select>
                </Field>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="text-sm font-extrabold text-emerald-800">Final display price</div>
                  <div className="mt-2 text-3xl font-black text-emerald-700">{inr(Number(draft.price || 0))}</div>
                  <div className="mt-1 text-xs font-bold text-emerald-700">MRP {inr(Number(draft.mrp || 0))} · GST {draft.gstRate ?? 0}% {draft.gstMode?.toLowerCase()}</div>
                </div>
              </div>
            </div>

            <Field label="Product description">
              <textarea
                value={draft.description ?? ""}
                onChange={(event) => update("description", event.target.value)}
                className="min-h-[96px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold outline-none ring-brand/20 transition focus:ring-4"
                placeholder="Pack size, brand details, storage notes, etc."
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          <Button className="border border-border bg-white text-gray-700" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand px-6 py-3 text-white" onClick={() => onSave({ ...draft, status })}>Save Inventory Item</Button>
        </div>
      </Card>
    </div>
  );
}
