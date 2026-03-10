"use client";

import { useState, useRef, useTransition } from "react";
import { createMenu, updateMenu, deleteMenu } from "@/app/actions/menu";
import type { Menu } from "@/lib/supabase";
import { formatRupiah } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Loader2, UtensilsCrossed, Sparkles } from "lucide-react";

export default function MenuManagementClient({ menus }: { menus: Menu[] }) {
  const [filter, setFilter] = useState<"all" | "available" | "sold_out">("all");
  const [showForm, setShowForm] = useState(false);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredMenus = menus.filter((m) => filter === "all" || m.status === filter);

  function openForm(menu: Menu | null) {
    setEditMenu(menu);
    setPreviewUrl(menu?.foto_url ?? null);
    setImageUrlInput(menu?.foto_url ?? "");
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setTimeout(() => {
      setEditMenu(null);
      setPreviewUrl(null);
      setImageUrlInput("");
      if (fileRef.current) fileRef.current.value = "";
    }, 300);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrlInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const file = fileRef.current?.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("menu-photos")
          .upload(filename, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from("menu-photos").getPublicUrl(filename);
        fd.set("foto_url", urlData.publicUrl);
      } catch (err) {
        setError(`Gagal upload foto: ${(err as Error).message}`);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else if (imageUrlInput.trim()) {
      fd.set("foto_url", imageUrlInput.trim());
    } else {
      fd.set("foto_url", editMenu?.foto_url ?? "");
    }

    startTransition(async () => {
      // both create and edit will read from "status" because we pass the same FormData
      const res = editMenu ? await updateMenu(editMenu.id, fd) : await createMenu(fd);
      if (res.success) {
        closeForm();
      } else {
        setError(res.error ?? "Gagal menyimpan");
      }
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus menu ini secara permanen?")) return;
    startTransition(async () => {
      await deleteMenu(id);
    });
  }

  const getStatusBadge = (menu: Menu) => {
    if (menu.stock > 0) {
      return (
        <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-full text-[10px] font-bold tracking-tighter shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Stok: {menu.stock}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-red-500/80 backdrop-blur-md text-white border border-red-500/20 rounded-full text-[10px] font-bold tracking-tighter shadow-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Habis
      </span>
    );
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20">
              <UtensilsCrossed size={20} />
            </div>
            <h1 className="text-3xl font-serif text-white tracking-tight">Kelola Menu</h1>
          </div>
          <p className="text-sm font-light text-white/40 max-w-md">
            Atur dan perbarui daftar hidangan Anda. Pastikan status, harga, dan foto menu selalu aktual.
          </p>
        </div>
        <button
          onClick={() => openForm(null)}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-bold px-6 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-xl shadow-orange-500/20 text-sm tracking-wide"
        >
          <Plus size={18} />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Category/Status Filters */}
      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { key: "all", label: "Semua" },
          { key: "available", label: "Tersedia" },
          { key: "sold_out", label: "Habis" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
              filter === key
                ? "bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20"
                : "bg-transparent border-white/10 text-white/40 hover:border-white/30 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid of Menus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredMenus.map((menu, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={menu.id}
            className="bg-[#0a0a0a] rounded-[2.5rem] p-5 border border-white/5 hover:border-orange-500/30 transition-all group relative flex flex-col"
          >
            {/* Context Actions Hover (Edit & Delete) */}
            <div className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => openForm(menu)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-colors"
                title="Edit Menu"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDelete(menu.id)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:border-red-500 transition-colors"
                title="Hapus Menu"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Image Box */}
            <div className="relative h-48 mb-6 overflow-hidden rounded-[2rem] bg-white/5 shrink-0">
              {menu.foto_url ? (
                <Image
                  src={menu.foto_url}
                  alt={menu.nama}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  unoptimized // Bypass Next.js image optimization limits to ensure smooth rendering on dev
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                  <ImageIcon size={32} className="mb-2 opacity-50" />
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">No Image</span>
                </div>
              )}
              {/* Overlay Gradient at top for badge & actions contrast */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3">{getStatusBadge(menu)}</div>
            </div>

            {/* Content Info */}
            <div className="px-2 flex flex-col flex-1">
              <h3 className="text-lg font-serif font-medium text-white mb-auto line-clamp-2 leading-snug">
                {menu.nama}
              </h3>
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-xl font-light text-white flex items-center">
                  <span className="text-xs text-orange-500 font-bold mr-1">Rp</span>
                  {menu.harga.toLocaleString("id-ID")}
                </p>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 border border-white/5">
                  <UtensilsCrossed size={12} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4 border border-white/10">
            <UtensilsCrossed size={32} />
          </div>
          <p className="text-white/40 font-medium text-lg">Belum ada menu di kategori ini</p>
          <button onClick={() => openForm(null)} className="text-orange-500 text-sm font-medium hover:underline mt-2">
            Tambah Menu Baru
          </button>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Inner Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

              <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                    {editMenu ? <Edit2 size={18} /> : <Sparkles size={18} />}
                  </div>
                  <h3 className="font-serif text-xl text-white tracking-wide">
                    {editMenu ? "Edit Menu" : "Tambah Menu"}
                  </h3>
                </div>
                <button
                  onClick={closeForm}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-2">
                    Nama Menu
                  </label>
                  <input
                    name="nama"
                    defaultValue={editMenu?.nama ?? ""}
                    required
                    placeholder="Contoh: Nasi Goreng Gila"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/20 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-2">
                      Harga (Rp)
                    </label>
                    <input
                      name="harga"
                      type="number"
                      defaultValue={editMenu?.harga ?? ""}
                      required
                      min={0}
                      placeholder="20000"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-2">
                      Stok
                    </label>
                    <input
                      name="stock"
                      type="number"
                      defaultValue={editMenu?.stock ?? 0}
                      required
                      min={0}
                      placeholder="50"
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-3 ml-2">
                    Foto Menu
                  </label>

                  {/* URL Input */}
                  <div className="mb-3">
                    <input
                      type="url"
                      placeholder="Paste link gambar (https://...)"
                      value={imageUrlInput}
                      onChange={(e) => {
                        setImageUrlInput(e.target.value);
                        if (e.target.value.trim()) {
                          setPreviewUrl(e.target.value.trim());
                          if (fileRef.current) fileRef.current.value = "";
                        } else {
                          setPreviewUrl(null);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/20 transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">atau upload</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  {previewUrl ? (
                    <div className="mb-3 relative w-full h-40 rounded-2xl overflow-hidden border border-white/10 group">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewUrl(null);
                            setImageUrlInput("");
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          className="bg-red-500 text-white rounded-full p-3 hover:bg-red-600 transition-colors shadow-2xl shadow-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-40 rounded-2xl border-2 border-dashed border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center text-white/30 cursor-pointer relative group"
                      onClick={() => fileRef.current?.click()}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon size={20} />
                      </div>
                      <span className="text-xs font-bold text-white/50">Upload Foto</span>
                      <span className="text-[10px] uppercase tracking-widest mt-1 opacity-50">JPG, PNG maks 5MB</span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 py-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-medium flex gap-3 items-start leading-relaxed"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 border border-white/10 bg-transparent hover:bg-white/5 text-white font-medium py-4 rounded-2xl text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-4 rounded-2xl text-sm transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
                  >
                    {isPending || isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{editMenu ? "Simpan Perubahan" : "Simpan Menu"}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
