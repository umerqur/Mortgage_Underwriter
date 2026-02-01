// Edge function: intake-signed-url
// Generates a time-limited signed URL for a file in brokerops_uploads.
// Verifies the requesting user owns the parent intake before issuing the URL.
//
// Security notes:
// - Never logs JWTs, secrets, or service-role keys.
// - User-scoped client identifies auth.uid(); service-role client is used
//   only AFTER ownership is verified, and only to generate the signed URL.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://brokerops.ca",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // ---- Step 1: Authenticate the caller via their JWT ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ---- Step 2: Parse and validate request body ----
    const { intake_id, file_path } = await req.json();

    if (
      !intake_id ||
      typeof intake_id !== "string" ||
      !file_path ||
      typeof file_path !== "string"
    ) {
      return jsonResponse(
        { error: "intake_id (string) and file_path (string) are required" },
        400
      );
    }

    // Validate the file_path matches the expected structure:
    //   intakes/{intakeId}/{uploadId}/{fileName}
    const segments = file_path.split("/");
    if (
      segments.length < 4 ||
      segments[0] !== "intakes" ||
      segments[1] !== intake_id
    ) {
      return jsonResponse(
        { error: "file_path must match intakes/{intakeId}/{uploadId}/{fileName}" },
        400
      );
    }

    // ---- Step 3: Verify ownership (service-role, post-auth only) ----
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: intake, error: intakeError } = await adminClient
      .from("intakes")
      .select("id, created_by_user_id")
      .eq("id", intake_id)
      .single();

    if (intakeError || !intake) {
      return jsonResponse({ error: "Intake not found" }, 404);
    }

    if (intake.created_by_user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // ---- Step 4: Generate signed URL ----
    const { data: signedUrlData, error: signedUrlError } = await adminClient
      .storage
      .from("brokerops_uploads")
      .createSignedUrl(file_path, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData) {
      return jsonResponse({ error: "Failed to generate signed URL" }, 500);
    }

    return jsonResponse(
      {
        signed_url: signedUrlData.signedUrl,
        expires_in: SIGNED_URL_EXPIRY_SECONDS,
      },
      200
    );
  } catch (_) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
