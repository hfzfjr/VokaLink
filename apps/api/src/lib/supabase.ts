import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl =
  process.env["SUPABASE_URL"] || "https://ygxzoeghnjclfcrujvbx.supabase.co";
const serviceRoleKey =
  process.env["SUPABASE_SERVICE_ROLE_KEY"] || "dummy-service-role-key-for-test-mocking";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface CreateAdminUserParams {
  email: string;
  password?: string;
  fullName: string;
  role: "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";
  schoolId: string;
}

/**
 * Creates or provisions user in Supabase Auth via Admin API
 */
export async function provisionSupabaseUser(params: CreateAdminUserParams): Promise<{ id: string }> {
  // If no service role key (e.g. mock test environment), generate a random UUID
  if (!serviceRoleKey || process.env["NODE_ENV"] === "test") {
    return { id: randomUUID() };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: params.email,
      password: params.password ?? "VokaLink2026!",
      email_confirm: true,
      app_metadata: {
        role: params.role,
        school_id: params.schoolId,
      },
      user_metadata: {
        full_name: params.fullName,
      },
    });

    if (error) {
      // If user already exists in auth, try to retrieve their ID
      if (error.message.includes("already registered") || error.code === "email_exists") {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users.find((u) => u.email === params.email);
        if (existing) {
          return { id: existing.id };
        }
      }
      throw error;
    }

    return { id: data.user.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // If connection to Supabase fails in development, fallback gracefully to UUID
    if (process.env["NODE_ENV"] === "development") {
      console.warn("⚠️ Supabase auth admin call warning, using generated UUID:", message);
      return { id: randomUUID() };
    }
    throw err;
  }
}
