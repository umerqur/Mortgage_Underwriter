// Edge function: extract-key-info
// Downloads an uploaded document, sends it to Claude for structured extraction,
// merges the result into the intake's underwriting_profile, and returns the update.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---- Extraction types (mirrors src/lib/underwritingProfile.ts) ----

interface TaxDocumentExtraction {
  uploadId: string;
  docId: string;
  documentType: string;
  documentLabel: string;
  taxYear: number | null;
  totalIncome: number | null;
  netIncome: number | null;
  taxableIncome: number | null;
  taxpayerName: string | null;
}

interface UnderwritingProfile {
  borrower: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    sinLast4?: string;
    email?: string;
  };
  income: {
    employment?: {
      annualIncome?: number;
      netIncome?: number;
      taxableIncome?: number;
      sourceDocuments: string[];
    };
    selfEmployment?: {
      netIncome?: number;
      taxableIncome?: number;
      sourceDocuments: string[];
    };
  };
  extractedDocuments: TaxDocumentExtraction[];
  metadata: {
    lastUpdatedAt: string;
  };
}

// ---- Profile helpers ----

function createEmptyProfile(
  firstName: string,
  lastName: string,
  email?: string | null,
): UnderwritingProfile {
  return {
    borrower: { firstName, lastName, email: email ?? undefined },
    income: {},
    extractedDocuments: [],
    metadata: { lastUpdatedAt: new Date().toISOString() },
  };
}

function mergeExtraction(
  profile: UnderwritingProfile,
  extraction: TaxDocumentExtraction,
): UnderwritingProfile {
  const otherDocs = profile.extractedDocuments.filter(
    (d) => d.uploadId !== extraction.uploadId,
  );
  const allExtractions = [...otherDocs, extraction];

  const incomeExtractions = allExtractions
    .filter(
      (d) =>
        d.totalIncome != null ||
        d.netIncome != null ||
        d.taxableIncome != null,
    )
    .sort((a, b) => (b.taxYear ?? 0) - (a.taxYear ?? 0));

  const income = { ...profile.income };

  if (incomeExtractions.length > 0) {
    const latest = incomeExtractions[0];
    income.employment = {
      annualIncome: latest.totalIncome ?? undefined,
      netIncome: latest.netIncome ?? undefined,
      taxableIncome: latest.taxableIncome ?? undefined,
      sourceDocuments: incomeExtractions.map(
        (e) => `${e.documentLabel}${e.taxYear ? ` (${e.taxYear})` : ""}`,
      ),
    };
  }

  return {
    ...profile,
    income,
    extractedDocuments: allExtractions,
    metadata: { lastUpdatedAt: new Date().toISOString() },
  };
}

// ---- Claude API call ----

const EXTRACTION_PROMPT = `You are extracting tax document information from a Canadian tax document. Analyze this document and extract the following fields. Return ONLY a valid JSON object with these exact keys. Use null for any value you cannot confidently identify from the document.

{
  "documentType": "noa" or "t1_general" or "other",
  "taxYear": (number or null),
  "totalIncome": (number or null — line 15000 on T1, or total income on NOA),
  "netIncome": (number or null — line 23600 on T1, or net income on NOA),
  "taxableIncome": (number or null — line 26000 on T1, or taxable income on NOA),
  "taxpayerName": (string or null — full name of the taxpayer)
}

Rules:
- Do not guess or hallucinate values. If a value is not clearly visible, use null.
- Return only the JSON object. No markdown, no explanation.`;

interface ClaudeExtractionResult {
  documentType: string;
  taxYear: number | null;
  totalIncome: number | null;
  netIncome: number | null;
  taxableIncome: number | null;
  taxpayerName: string | null;
}

async function callClaudeExtraction(
  fileBytes: Uint8Array,
  mimeType: string,
): Promise<ClaudeExtractionResult> {
  const b64 = base64Encode(fileBytes);

  // Build the content block based on mime type
  const isPdf = mimeType === "application/pdf";
  const mediaBlock = isPdf
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf",
          data: b64,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mimeType,
          data: b64,
        },
      };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [mediaBlock, { type: "text", text: EXTRACTION_PROMPT }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${err}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text ?? "";

  // Parse JSON from the response (strip markdown fences if present)
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as ClaudeExtractionResult;
}

// ---- Main handler ----

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Step 1: Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Step 2: Parse request
    const { intake_id, upload_id } = await req.json();

    if (!intake_id || typeof intake_id !== "string") {
      return jsonResponse({ error: "intake_id (string) is required" }, 400);
    }
    if (!upload_id || typeof upload_id !== "string") {
      return jsonResponse({ error: "upload_id (string) is required" }, 400);
    }

    // Step 3: Verify ownership
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: intake, error: intakeError } = await adminClient
      .from("intakes")
      .select("id, created_by_user_id, client_first_name, client_last_name, client_email, underwriting_profile")
      .eq("id", intake_id)
      .single();

    if (intakeError || !intake) {
      return jsonResponse({ error: "Intake not found" }, 404);
    }

    if (intake.created_by_user_id !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Step 4: Get upload record
    const { data: upload, error: uploadError } = await adminClient
      .from("intake_uploads")
      .select("id, file_path, mime_type, doc_id, upload_status")
      .eq("id", upload_id)
      .eq("intake_id", intake_id)
      .single();

    if (uploadError || !upload) {
      return jsonResponse({ error: "Upload not found" }, 404);
    }

    if (upload.upload_status !== "uploaded") {
      return jsonResponse({ error: "Upload has been deleted" }, 400);
    }

    // Step 5: Download file from storage
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("brokerops_uploads")
      .download(upload.file_path);

    if (downloadError || !fileData) {
      return jsonResponse({ error: "Failed to download file" }, 500);
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());

    // Step 6: Call Claude API
    const claudeResult = await callClaudeExtraction(bytes, upload.mime_type);

    // Build document label from type
    const docLabelMap: Record<string, string> = {
      noa: "NOA",
      t1_general: "T1 General",
      other: "Document",
    };

    const extraction: TaxDocumentExtraction = {
      uploadId: upload_id,
      docId: upload.doc_id ?? "",
      documentType: claudeResult.documentType ?? "other",
      documentLabel: docLabelMap[claudeResult.documentType] ?? "Document",
      taxYear: claudeResult.taxYear,
      totalIncome: claudeResult.totalIncome,
      netIncome: claudeResult.netIncome,
      taxableIncome: claudeResult.taxableIncome,
      taxpayerName: claudeResult.taxpayerName,
    };

    // Step 7: Merge into profile
    let profile: UnderwritingProfile =
      (intake.underwriting_profile as UnderwritingProfile | null) ??
      createEmptyProfile(
        intake.client_first_name,
        intake.client_last_name,
        intake.client_email,
      );

    profile = mergeExtraction(profile, extraction);

    // Step 8: Save profile to intake + update upload extraction status
    const { error: updateIntakeError } = await adminClient
      .from("intakes")
      .update({ underwriting_profile: profile })
      .eq("id", intake_id);

    if (updateIntakeError) {
      return jsonResponse({ error: "Failed to save profile" }, 500);
    }

    const { error: updateUploadError } = await adminClient
      .from("intake_uploads")
      .update({
        extraction_status: "extracted",
        extracted_json: extraction,
      })
      .eq("id", upload_id);

    if (updateUploadError) {
      console.error("Failed to update upload extraction status:", updateUploadError);
    }

    return jsonResponse(
      {
        extraction,
        underwriting_profile: profile,
      },
      200,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("extract-key-info error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
