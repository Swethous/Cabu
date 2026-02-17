export type UploadPostImageResponse = {
  path: string;
  publicUrl: string; // ✅ route 응답 그대로
};

export async function uploadPostImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads/post-image", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    // 서버가 json 에러를 주는 경우
    const text = await res.text();
    throw new Error(text || "Upload failed");
  }

  return (await res.json()) as UploadPostImageResponse;
}