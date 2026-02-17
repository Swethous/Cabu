export type UploadAvatarResponse = {
  path: string;
  publicUrl: string;
};

export async function uploadAvatarImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads/avatar", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return (await res.json()) as UploadAvatarResponse;
}