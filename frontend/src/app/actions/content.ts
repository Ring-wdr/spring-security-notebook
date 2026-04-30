"use server";

import { cookies } from "next/headers";
import { forbidden } from "next/navigation";

import type { ContentUpsertRequest } from "@/generated/openapi/src/models";
import { createDisplayError, type DisplayError } from "@/lib/auth-errors";
import { updateContentAfterMutation } from "@/lib/server/content/content-cache-invalidation";
import { canManageContent } from "@/lib/server/content/permissions";
import {
  clearSessionCookie,
  writeSessionCookie,
} from "@/lib/server/session-cookie";
import {
  BackendRequestError,
  executeOpenApiRequest,
} from "@/lib/server/openapi-client";
import { getApiBaseUrl, requireSession } from "@/lib/server/session";
import type { TokenPairResponse } from "@/lib/types";

export type SaveContentFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  error: DisplayError | null;
  contentId?: number;
};

type ParsedContentId =
  | { kind: "create" }
  | { kind: "update"; id: number }
  | { kind: "invalid" };

type ParsedPublished = { kind: "valid"; value: boolean } | { kind: "invalid" };

const CONTENT_ID_PATTERN = /^[1-9]\d*$/;

export const initialSaveContentFormState: SaveContentFormState = {
  status: "idle",
  message: null,
  error: null,
};

export async function saveManagedContentAction(
  _previousState: SaveContentFormState,
  formData: FormData,
): Promise<SaveContentFormState> {
  const session = await requireSession("/manage/content");

  if (!canManageContent(session)) {
    forbidden();
  }

  const parsedId = parseContentId(formData.get("id"));
  const contentUpsertRequest = parseContentUpsertRequest(formData);

  if (parsedId.kind === "invalid") {
    return {
      status: "error",
      message: null,
      error: createDisplayError("ERROR_BAD_REQUEST", "Content id is invalid."),
    };
  }

  if (!contentUpsertRequest) {
    return {
      status: "error",
      message: null,
      error: createDisplayError(
        "ERROR_BAD_REQUEST",
        "Content fields are required.",
      ),
    };
  }

  let nextTokens: TokenPairResponse = session.tokens;
  let shouldClearSession = false;

  async function persistRotatedTokens() {
    if (nextTokens !== session.tokens) {
      writeSessionCookie(await cookies(), nextTokens);
    }
  }

  try {
    const content = await executeOpenApiRequest({
      baseUrl: getApiBaseUrl(),
      tokens: session.tokens,
      createApi: ({ content }) => content,
      operation: (contentApi) =>
        parsedId.kind === "create"
          ? contentApi.createContent({ contentUpsertRequest })
          : contentApi.updateContent({
              contentId: parsedId.id,
              contentUpsertRequest,
            }),
      onTokensRotated(rotatedTokens) {
        nextTokens = rotatedTokens;
      },
      onUnauthorized() {
        shouldClearSession = true;
      },
    });

    await persistRotatedTokens();
    updateContentAfterMutation(content.id);

    return {
      status: "success",
      message:
        parsedId.kind === "create" ? "Content created." : "Content updated.",
      error: null,
      contentId: content.id,
    };
  } catch (error) {
    await persistRotatedTokens();

    if (shouldClearSession) {
      clearSessionCookie(await cookies());
    }

    if (error instanceof BackendRequestError) {
      return {
        status: "error",
        message: null,
        error: {
          code: error.code,
          message: error.displayMessage,
        },
      };
    }

    return {
      status: "error",
      message: null,
      error: createDisplayError("ERROR_CONTENT"),
    };
  }
}

function parseContentUpsertRequest(
  formData: FormData,
): ContentUpsertRequest | null {
  const title = parseRequiredTextField(formData.get("title"));
  const body = parseRequiredTextField(formData.get("body"));
  const category = parseRequiredTextField(formData.get("category"));
  const published = parsePublishedField(formData.get("published"));

  if (
    title == null ||
    body == null ||
    category == null ||
    published.kind === "invalid"
  ) {
    return null;
  }

  return {
    title,
    body,
    category,
    published: published.value,
  };
}

function parseRequiredTextField(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text ? text : null;
}

function parseContentId(value: FormDataEntryValue | null): ParsedContentId {
  if (value == null || value === "") {
    return { kind: "create" };
  }

  if (typeof value !== "string" || !CONTENT_ID_PATTERN.test(value)) {
    return { kind: "invalid" };
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { kind: "invalid" };
  }

  return { kind: "update", id };
}

function parsePublishedField(value: FormDataEntryValue | null): ParsedPublished {
  if (value === "true") {
    return { kind: "valid", value: true };
  }

  if (value === "false") {
    return { kind: "valid", value: false };
  }

  return { kind: "invalid" };
}
