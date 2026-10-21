import { uploadStudentMedia } from "./student-media.functions";

/** Browser entry point for student photos/media: always via the consent-checked server function. */
export async function uploadStudentPhoto(studentId: string, file: File) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return uploadStudentMedia({
    data: { studentId, contentType: file.type as "image/jpeg" | "image/png" | "image/webp", base64: btoa(bin) },
  });
}
