/**
 * Student photo/media object paths (pure). Student media lives in the
 * school-media bucket under `<school_id>/students/<student_id>/<file>` and may
 * only be written by the server function (consent-checked, service role);
 * storage RLS (migration 20261020000070) denies direct authenticated writes
 * to that prefix. Website and staff media paths are unaffected.
 */
export const STUDENT_MEDIA_BUCKET = "school-media";
export const STUDENT_MEDIA_SEGMENT = "students";
export const STUDENT_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const STUDENT_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function studentMediaExtension(contentType: string): string | null {
  return EXT[contentType] ?? null;
}

export function studentMediaPath(schoolId: string, studentId: string, objectName: string): string {
  return `${schoolId}/${STUDENT_MEDIA_SEGMENT}/${studentId}/${objectName}`;
}

export function isStudentMediaPath(path: string): boolean {
  return path.split("/")[1] === STUDENT_MEDIA_SEGMENT;
}
