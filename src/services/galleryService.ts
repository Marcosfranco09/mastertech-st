import { GalleryPhoto } from '@/types';
import { supabase } from '@/lib/supabase';

// Helper to convert base64 to Blob
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export async function fetchGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const { data, error } = await supabase.storage.from('gallery').list();
    if (error) {
      console.error('Error fetching from Supabase:', error);
      return [];
    }
    
    if (!data) return [];

    // Filter out potential empty folders or hidden files
    const files = data.filter(file => file.name && file.name !== '.emptyFolderPlaceholder');

    const photos: GalleryPhoto[] = files.map(file => {
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(file.name);
      return {
        id: file.name, // Use filename as ID
        dataUrl: publicUrl,
        date: file.created_at || new Date().toISOString()
      };
    });

    // Sort by newest first
    return photos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to fetch gallery photos:', error);
    return [];
  }
}

export async function addGalleryPhoto(dataUrl: string): Promise<GalleryPhoto> {
  const photoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
  
  try {
    const blob = dataURLtoBlob(dataUrl);
    
    const { error } = await supabase.storage
      .from('gallery')
      .upload(photoId, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(photoId);

    return {
      id: photoId,
      dataUrl: publicUrl,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to upload photo to Supabase:', error);
    // Return a temporary fallback if it fails, though ideally we should throw
    throw error;
  }
}

export async function markGalleryPhotoUsed(id: string): Promise<string> {
  try {
    const newId = `used/${id}`;
    const { error } = await supabase.storage.from('gallery').move(id, newId);
    if (error) {
      console.error('Error marking as used in Supabase:', error);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(newId);
    return publicUrl;
  } catch (error) {
    console.error('Failed to mark photo as used:', error);
    throw error;
  }
}

export async function removeGalleryPhoto(id: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from('gallery').remove([id]);
    if (error) {
      console.error('Error deleting from Supabase:', error);
    }
  } catch (error) {
    console.error('Failed to delete gallery photo:', error);
  }
}
