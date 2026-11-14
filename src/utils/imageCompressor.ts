import { FIELD_LIMITS } from '../types/cirs';

export interface CompressedImageResult {
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
  width: number;
  height: number;
}

function estimateBase64Bytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return cleaned || 'issue_photo.jpg';
}

export async function compressImageForFirestore(file: File): Promise<CompressedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPEG, PNG, or WebP).');
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Original image exceeds 15 MB. Please select a smaller photo.');
  }

  const imageBitmap = await createImageElement(file);

  const maxDimensions = [1024, 800, 640, 480];
  const qualities = [0.76, 0.62, 0.48, 0.36];

  for (const maxDim of maxDimensions) {
    const scale = Math.min(1, maxDim / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.max(1, Math.round(imageBitmap.width * scale));
    const height = Math.max(1, Math.round(imageBitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image compression canvas is unavailable in this browser.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    for (const quality of qualities) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const sizeBytes = estimateBase64Bytes(dataUrl);

      if (
        sizeBytes > 0 &&
        sizeBytes <= FIELD_LIMITS.imageMaxBytes &&
        dataUrl.length <= FIELD_LIMITS.imageMaxDataUrlLength
      ) {
        return {
          dataUrl,
          fileName: sanitizeFileName(file.name.replace(/\.[^.]+$/, '') + '.jpg'),
          sizeBytes,
          width,
          height,
        };
      }
    }
  }

  throw new Error(
    'Unable to compress image below 250 KB. Please choose a simpler or lower-resolution photo.'
  );
}

function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode the selected image file.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));
    reader.readAsDataURL(file);
  });
}
