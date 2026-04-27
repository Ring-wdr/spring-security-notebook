"use client";

import { createDisplayError } from "./auth-errors";

export class ApiClientError extends Error {
  code: string;
  displayMessage: string;
  status: number;

  constructor(code: string, displayMessage: string, status: number) {
    super(displayMessage);
    this.name = "ApiClientError";
    this.code = code;
    this.displayMessage = displayMessage;
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    await extractError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function extractError(response: Response): Promise<never> {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    const displayError = createDisplayError(
      data.error ?? `HTTP_${response.status}`,
      data.message,
    );
    throw new ApiClientError(
      displayError.code,
      displayError.message,
      response.status,
    );
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      `HTTP_${response.status}`,
      createDisplayError(`HTTP_${response.status}`).message,
      response.status,
    );
  }
}
