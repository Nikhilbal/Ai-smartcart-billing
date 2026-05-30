import { Edit3, PackagePlus, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { products as initialProducts, Product } from "../data/mock";
import { cn, inr } from "../lib/utils";
import { Badge, Button, Card, Input } from "../components/ui";

function statusTone(status: Product["status"]) {
  if (status === "OK") return "bg-emerald-50 text-success";
  if (status === "LOW") return "bg-yellow-50 text-warning";
  return "bg-red-50 text-danger";
}

export function InventoryManagement({ onReorder }: { onReorder: (product: Product) => void }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(
    () => products.filter((product) => `${product.name} ${product.barcode} ${product.category}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  function restock(product: Product) {
    setProducts((items) =>
      items.map((item) => (item.id === product.id ? { ...item, stock: item.stock + 100, status: item.stock + 100 < 50 ? "LOW" : "OK" } : item))
    );
  }

  function remove(id: string) {
    setProducts((items) => items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-4">
          <Badge className="bg-blue-50 px-5 py-3 text-base text-brand">{products.length} Total Items</Badge>
          <Badge className="bg-red-50 px-5 py-3 text-base text-danger">{products.filter((p) => p.stock < 50).length} Low Stock</Badge>
          <Badge className="bg-emerald-50 px-5 py-3 text-base text-success">Stock Value: ₹120k</Badge>
        </div>
        <div className="flex gap-3">
          <div className="relative w-full min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input className="pl-12" placeholder="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Button onClick={() => setEditing({ id: "new", name: "", barcode: "", category: "Dairy", price: 0, stock: 50, min: 50, status: "OK", supplier: "", image: initialProducts[0].image })} className="bg-brand text-white">
            <Plus size={18} /> Add Product
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[980px] table-fixed text-left">
            <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
              <tr>
                <th className="w-[30%] px-6 py-5">Product</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Price</th>
                <th className="px-6 py-5">Stock</th>
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5"><Badge className="bg-gray-100 text-gray-600">{product.category}</Badge></td>
                  <td className="px-6 py-5 text-lg font-extrabold text-brand">{inr(product.price)}</td>
                  <td className="px-6 py-5">
                    <div className="font-mono text-lg font-black">{product.stock}</div>
                    <div className="text-sm font-semibold text-gray-400">min: {product.min}</div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={cn(statusTone(product.status), "text-sm")}>
                      <span className={cn("mr-2 h-3 w-3 rounded-full", product.status === "OK" ? "bg-green-500" : product.status === "LOW" ? "bg-yellow-400" : "bg-red-500")} />
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <Button onClick={() => setEditing(product)} className="bg-blue-50 p-3 text-brand"><Edit3 size={18} /></Button>
                      {product.stock < product.min ? <Button onClick={() => onReorder(product)} className="bg-orange-50 p-3 text-warning"><PackagePlus size={18} /></Button> : null}
                      <Button onClick={() => restock(product)} className="bg-emerald-50 p-3 text-success"><RefreshCw size={18} /></Button>
                      <Button onClick={() => remove(product.id)} className="bg-red-50 p-3 text-danger"><Trash2 size={18} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            setProducts((items) => (next.id === "new" ? [{ ...next, id: `p${Date.now()}` }, ...items] : items.map((item) => (item.id === next.id ? next : item))));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (product: Product) => void }) {
  const [draft, setDraft] = useState(product);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl p-6">
        <h2 className="text-2xl font-extrabold">{product.id === "new" ? "Add Product" : "Edit Product"}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input placeholder="Product name" value={draft.name} onChange={(event) => update("name", event.target.value)} />
          <Input placeholder="Barcode" value={draft.barcode} onChange={(event) => update("barcode", event.target.value)} />
          <Input placeholder="Category" value={draft.category} onChange={(event) => update("category", event.target.value)} />
          <Input placeholder="Supplier" value={draft.supplier} onChange={(event) => update("supplier", event.target.value)} />
          <Input type="number" placeholder="Price" value={draft.price} onChange={(event) => update("price", Number(event.target.value))} />
          <Input type="number" placeholder="Stock" value={draft.stock} onChange={(event) => update("stock", Number(event.target.value))} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button className="border border-border bg-white text-gray-700" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand text-white" onClick={() => onSave({ ...draft, status: draft.stock < 15 ? "CRITICAL" : draft.stock < 50 ? "LOW" : "OK" })}>Save Product</Button>
        </div>
      </Card>
    </div>
  );
}
