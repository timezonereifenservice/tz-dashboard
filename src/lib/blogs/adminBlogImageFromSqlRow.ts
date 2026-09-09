export function adminBlogImageFromSqlRow(row: Record<string, unknown>) {
  const createdAt = row.created_at;
  const createdAtIso =
    createdAt instanceof Date
      ? createdAt.toISOString()
      : typeof createdAt === "string"
        ? createdAt
        : new Date().toISOString();

  return {
    id: row.id as string,
    originalFileName: row.original_file_name as string,
    mimeType: row.mime_type as string,
    storagePath: row.storage_path as string,
    publicUrl: row.public_url as string,
    width: (row.width as number | null | undefined) ?? null,
    height: (row.height as number | null | undefined) ?? null,
    sizeBytes: Number(row.size_bytes ?? 0),
    sourceType: (row.source_type as string) ?? "UPLOAD",
    altText: (row.alt_text as string | null | undefined) ?? null,
    uploadedByUserId: row.uploaded_by_user_id as string,
    createdAt: createdAtIso,
  };
}
