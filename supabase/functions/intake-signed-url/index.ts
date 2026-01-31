// Edge function: intake-signed-url
// Generates a time-limited signed URL for a file in brokerops_uploads.
// Verifies the requesting user owns the parent intake before issuing the URL.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SIGNED_URL_EXPIRY_SECONDS = 60 * 10; // 10 minutes

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate the caller using their JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Client scoped to the calling user (respects RLS)
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { intake_id, file_path } = await req.json();

    if (!intake_id || !file_path) {
      return new Response(
        JSON.stringify({ error: "intake_id and file_path are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify ownership: the intake must belong to the calling user
    // Use the service-role client so the check is not blocked by RLS
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: intake, error: intakeError } = await adminClient
      .from("intakes")
      .select("id, created_by_user_id")
      .eq("id", intake_id)
      .single();

    if (intakeError || !intake) {
      return new Response(JSON.stringify({ error: "Intake not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (intake.created_by_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure the file_path starts with the correct intake prefix
    const expectedPrefix = `intakes/${intake_id}/`;
    if (!file_path.startsWith(expectedPrefix)) {
      return new Response(
        JSON.stringify({ error: "File path does not belong to this intake" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL using service-role client (bypasses storage RLS)
    const { data: signedUrlData, error: signedUrlError } = await adminClient
      .storage
      .from("brokerops_uploads")
      .createSignedUrl(file_path, SIGNED_URL_EXPIRY_SECONDS);

    if (signedUrlError || !signedUrlData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        signed_url: signedUrlData.signedUrl,
        expires_in: SIGNED_URL_EXPIRY_SECONDS,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
