"use server";

import { forbidden } from "next/navigation";

import type { ContentUpsertRequest } from "@/generated/openapi/src/models";
import { createDisplayError, type DisplayError } from "@/lib/auth-errors";
import { updateContentAfterMutation } from "@/lib/server/content/content-cache-invalidation";
import { canManageContent } from "@/lib/server/content/permissions";
import {
  BackendRequestError,
  executeOpenApiRequest,
} from "@/lib/server/openapi-client";
import { getApiBaseUrl, requireSession } from "@/lib/server/session";

export type SaveContentFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  error: DisplayError | null;
  contentId?: number;
};

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

  const id = parseOptionalContentId(formData.get("id"));
  const contentUpsertRequest = parseContentUpsertRequest(formData);

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

  try {
    const content = await executeOpenApiRequest({
      baseUrl: getApiBaseUrl(),
      tokens: session.tokens,
      createApi: ({ content }) => content,
      operation: (contentApi) =>
        id == null
          ? contentApi.createContent({ contentUpsertRequest })
          : contentApi.updateContent({
              contentId: id,
              contentUpsertRequest,
            }),
    });

    updateContentAfterMutation(content.id);

    return {
      status: "success",
      message: id == null ? "Content created." : "Content updated.",
      error: null,
      contentId: content.id,
    };
  } catch (error) {
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
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const published = formData.get("published") === "true";

  if (!title || !body || !category) {
    return null;
  }

  return {
    title,
    body,
    category,
    published,
  };
}

function parseOptionalContentId(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
