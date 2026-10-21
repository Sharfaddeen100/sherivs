/**
 * Shared row/insert/update aliases for the Sherivs Scholar tables.
 * Derived from the generated Supabase types so they never drift from the schema.
 */
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

export type HostelRoom = Row<"hostel_rooms">;
export type HostelAllocation = Row<"hostel_allocations">;
export type HostelAttendance = Row<"hostel_attendance">;
export type ClinicVisit = Row<"clinic_visits">;
export type LibraryBook = Row<"library_books">;
export type LibraryBorrowing = Row<"library_borrowings">;
export type DisciplineRecord = Row<"discipline_records">;
export type AdmissionApplication = Row<"admission_applications">;
export type StaffPayroll = Row<"staff_payroll">;
export type StaffLeave = Row<"staff_leave">;
export type StudentPlatformFeeLedger = Row<"student_platform_fee_ledger">;
export type AuditLog = Row<"audit_logs">;
export type SchoolRow = Row<"schools">;
export type StudentRow = Row<"students">;
export type UserRow = Row<"users">;
