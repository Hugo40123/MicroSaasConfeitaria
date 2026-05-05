import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const imageMaxSizeBytes = 2 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

function getStorageDriver() {
  return process.env.UPLOAD_STORAGE_DRIVER?.trim().toLowerCase() || "local";
}

async function validateImage(file: File) {
  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  }

  if (file.size > imageMaxSizeBytes) {
    throw new Error("A imagem deve ter no maximo 2 MB.");
  }

  return {
    extension,
    buffer: Buffer.from(await file.arrayBuffer())
  };
}

async function saveLocalProductImage(file: File) {
  const { buffer, extension } = await validateImage(file);
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(filePath, buffer);

  return `/uploads/products/${fileName}`;
}

async function saveSupabaseProductImage(file: File) {
  const { buffer, extension } = await validateImage(file);
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para upload persistente.");
  }

  const objectPath = `products/${randomUUID()}.${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "cache-control": "3600",
      "content-type": file.type,
      "x-upsert": "false"
    },
    body: buffer
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar imagem para Supabase Storage: ${errorText}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export async function saveProductImage(file: File) {
  if (getStorageDriver() === "supabase") {
    return saveSupabaseProductImage(file);
  }

  return saveLocalProductImage(file);
}
