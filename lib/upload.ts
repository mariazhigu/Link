import { supabase } from './supabase';

export async function uploadImageFromUri(uri: string, bucket = 'images') {
  const res = await fetch(uri);
  const blob = await res.blob();
  const ext = uri.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(filename, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}
