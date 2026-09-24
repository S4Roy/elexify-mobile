import { api } from './client';
import { record, string } from './discovery';

export type PickedImage = { uri: string; name: string; mimeType: string };
export type UploadedMedia = { id: string; url: string };

export async function uploadMedia(
  files: PickedImage[],
  purpose?: 'return',
): Promise<UploadedMedia[]> {
  const formData = new FormData();
  if (purpose) {
    formData.append('purpose', purpose);
  }
  for (const file of files) {
    // React Native's FormData accepts this { uri, name, type } shape in
    // place of a real Blob/File — axios forwards it as-is to the native
    // networking layer, which streams the file from its uri.
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }
  const res = await api.post('user/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const docs = Array.isArray(res.data?.data) ? res.data.data : [];
  return docs
    .map((doc: unknown) => {
      const d = record(doc);
      return { id: string(d._id), url: string(d.url) };
    })
    .filter((doc: UploadedMedia) => doc.id && doc.url);
}
