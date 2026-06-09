import { useState, useRef, ChangeEvent } from "react";
import { Camera, Trash2, ImagePlus, Inbox, Upload, CheckSquare, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/store/AppContext";
import { toast } from "@/app/Toast";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { ImageWithFallback } from "@/app/components/ui/ImageWithFallback";
import logoImg from "@/imports/473046427_917832650556773_1093528259182468086_n.png";

const compressImage = (file: File, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string); // fallback
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG with 70% quality
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

function GalleryImage({ photo, isSelectMode, isSelected, onToggleSelect, onPreview }: { photo: any, isSelectMode: boolean, isSelected: boolean, onToggleSelect: () => void, onPreview: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative group rounded-2xl overflow-hidden border shadow-md aspect-square bg-black/10"
      style={{ borderColor: "var(--border)" }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-0">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
        </div>
      )}
      <img 
        src={photo.dataUrl} 
        alt="Galería" 
        onLoad={() => setIsLoaded(true)}
        className={`relative z-10 w-full h-full object-cover transition-all duration-300 cursor-pointer ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isSelectMode ? '' : 'hover:scale-110'}`}
        onClick={() => {
          if (isSelectMode) {
            onToggleSelect();
          } else {
            onPreview();
          }
        }}
      />
      {isSelectMode && isSelected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute z-20 inset-0 bg-primary/20 flex items-center justify-center pointer-events-none ring-4 ring-primary border-primary"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="bg-primary text-white rounded-full p-1 shadow-md"
          >
            <Check size={20} />
          </motion.div>
        </motion.div>
      )}
      <div className="absolute z-20 bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <p className="text-[10px] text-white/90 truncate font-medium">
          {new Date(photo.date).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export function GalleryView() {
  const { state, actions } = useAppContext();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{id: string, dataUrl: string} | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleOptionClick = (type: 'camera' | 'gallery') => {
    setIsOptionModalOpen(false);
    if (type === 'camera' && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else if (type === 'gallery' && galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(async (file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }

      setUploadingCount(prev => prev + 1);

      try {
        const compressedBase64 = await compressImage(file);
        await actions.addGalleryPhoto(compressedBase64);
        toast.success("Foto añadida a la galería");
      } catch (e) {
        toast.error("Error al subir la foto");
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1));
      }
    });

    // Reset input so the same file can be uploaded again if needed
    // Reset input so the same file can be uploaded again if needed
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta foto de la galería?")) {
      await actions.removeGalleryPhoto(id);
      toast.success("Foto eliminada");
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.size} fotos?`)) {
      for (const id of selectedIds) {
        await actions.removeGalleryPhoto(id);
      }
      setSelectedIds(new Set());
      setIsSelectMode(false);
      toast.success(`${selectedIds.size} fotos eliminadas`);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {state.loading ? (
        <motion.div 
          key="loading-screen"
          layoutId="header-bg"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center shadow-md"
          style={{ background: "var(--primary)" }}
        >
          <motion.img 
            layoutId="logo"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            src={logoImg} 
            alt="MasterTech" 
            className="w-full max-w-[280px] object-contain drop-shadow-lg mb-10" 
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"
          />
        </motion.div>
      ) : (
        <motion.div 
          key="main-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-full bg-[var(--background)] relative"
        >
          <motion.div 
            layoutId="header-bg"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center justify-between pl-2 pr-3 py-3 shadow-md z-40 relative" 
            style={{ background: "var(--primary)" }}
          >
            <motion.img
              layoutId="logo"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              src={logoImg}
              alt="MasterTech Gamer Store"
              className="w-full max-w-[180px] object-contain object-left drop-shadow-sm"
              style={{ height: 52 }}
            />
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-2"
        >
          {isSelectMode ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="text-white hover:bg-white/20 px-3 h-9 rounded-full">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="text-[12px] h-9 px-4 flex items-center gap-2 rounded-full shadow-sm" variant="destructive">
                <Trash2 size={16} /> {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsSelectMode(true)} className="text-white hover:bg-white/20 px-2 h-9 rounded-full" title="Seleccionar varias">
                <CheckSquare size={20} />
              </Button>
              <Button size="sm" onClick={() => setIsOptionModalOpen(true)} className="text-[12px] h-9 px-4 flex items-center gap-2 hover:bg-white/90 shadow-sm rounded-full" style={{ background: "white", color: "var(--primary)", fontWeight: "bold" }}>
                <Camera size={16} /> Subir
              </Button>
            </>
          )}
        </motion.div>
        {/* Input para cámara directa */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
        {/* Input para galería múltiple */}
        <input 
          type="file" 
          accept="image/*" 
          multiple
          ref={galleryInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
        />
      </motion.div>

      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.galleryPhotos.length === 0 && uploadingCount === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center p-6" 
              style={{ color: "var(--muted-foreground)" }}
            >
              <Inbox size={80} className="mb-6 opacity-20" />
              <h3 className="text-xl font-medium mb-3 text-foreground">Tu galería está vacía</h3>
              <p className="text-sm max-w-sm mb-8 leading-relaxed">
                Captura fotos de los equipos que vayas recibiendo usando tu celular. Se guardarán aquí temporalmente para que puedas adjuntarlas luego al registrar la orden.
              </p>
              <Button onClick={() => setIsOptionModalOpen(true)} variant="outline" className="flex items-center gap-2 rounded-full h-10 px-6 shadow-sm" style={{ borderColor: "var(--border)" }}>
                <ImagePlus size={18} /> Añadir foto
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
            >
              {/* Esqueletos de carga para las fotos que se están subiendo */}
              {Array.from({ length: uploadingCount }).map((_, i) => (
                <motion.div 
                  key={`uploading-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group rounded-2xl overflow-hidden border shadow-sm aspect-square bg-black/80 flex flex-col items-center justify-center"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-[10px] text-white/70 font-medium">Subiendo...</span>
                </motion.div>
              ))}
              
              {/* Fotos reales ya subidas */}
              <AnimatePresence>
                {state.galleryPhotos.map((photo) => (
                  <GalleryImage 
                    key={photo.id}
                    photo={photo}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(photo.id)}
                    onToggleSelect={() => {
                      const newSet = new Set(selectedIds);
                      if (newSet.has(photo.id)) newSet.delete(photo.id);
                      else newSet.add(photo.id);
                      setSelectedIds(newSet);
                    }}
                    onPreview={() => setPreviewPhoto(photo)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
          <DialogHeader>
            <DialogTitle>Subir a Galería</DialogTitle>
            <DialogDescription>
              Elige cómo deseas añadir fotos a tu galería móvil.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button 
              onClick={() => handleOptionClick('camera')}
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Camera size={32} />
              </div>
              <span className="font-medium text-sm">Abrir Cámara</span>
            </button>
            <button 
              onClick={() => handleOptionClick('gallery')}
              className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Upload size={32} />
              </div>
              <span className="font-medium text-sm">Elegir Archivos</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none" style={{ background: "transparent" }}>
          <DialogTitle className="sr-only">Vista previa de imagen</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {previewPhoto && (
              <>
                <img 
                  src={previewPhoto.dataUrl} 
                  alt="Vista previa" 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute bottom-4 right-4 rounded-full shadow-lg"
                  onClick={() => {
                    handleDelete(previewPhoto.id);
                    setPreviewPhoto(null);
                  }}
                >
                  <Trash2 size={18} />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
    )}
    </AnimatePresence>
  );
}
