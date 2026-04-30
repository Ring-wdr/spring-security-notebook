"use client";

import {
  AdminSubscriberControllerApi,
  AuthControllerApi,
  Configuration,
  ResponseError,
} from "@/generated/openapi/src";

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

const browserApiConfiguration = new Configuration({
  basePath:
    typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
  fetchApi(input, init) {
    return fetch(input, {
      ...init,
      cache: "no-store",
    });
  },
});

export const backendApi = {
  adminSubscribers: new AdminSubscriberControllerApi(browserApiConfiguration),
  auth: new AuthControllerApi(browserApiConfiguration),
};

export async function apiRequest<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ResponseError) {
      await extractError(error.response);
    }
    throw error;
  }
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
