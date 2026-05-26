import { promises as fs } from "fs";
import path from "path";

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadParkingImage(file: File, ownerId: string) {
  const safeName = sanitizeFileName(file.name || "parking.jpg");
  const storageName = `${ownerId}-${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "parking-images";

  if (
    supabaseUrl &&
    serviceKey &&
    !supabaseUrl.includes("your-project") &&
    !serviceKey.includes("your-service-role-key")
  ) {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${storageName}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storageName}`;
  }

  const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDirectory, { recursive: true });
  await fs.writeFile(path.join(uploadsDirectory, storageName), buffer);
  return `/uploads/${storageName}`;
}
