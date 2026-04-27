import { describe, expect, it } from "vitest";

import { createDisplayError, getErrorMessage } from "./auth-errors";

describe("auth-errors", () => {
  it("falls back to the error code when no default message exists", () => {
    expect(getErrorMessage("ERROR_UNKNOWN")).toBe("ERROR_UNKNOWN");
  });

  it("uses the fallback message when the provided message is blank", () => {
    expect(createDisplayError("ERROR_BAD_REQUEST", "   ")).toEqual({
      code: "ERROR_BAD_REQUEST",
      message: "Request payload is invalid.",
    });
  });
});
