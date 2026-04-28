import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { ManageUsersClient } from "./manage-users-client";
import { server } from "@/test/msw/server";

describe("ManageUsersClient", () => {
  it("renders one dossier workspace with user role rows", () => {
    const { container } = render(
      <ManageUsersClient
        initialUsers={[
          {
            email: "user@example.com",
            nickname: "user",
            social: false,
            roleNames: ["ROLE_USER"],
          },
        ]}
      />,
    );

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(container.querySelectorAll(".user-role-row").length).toBeGreaterThan(0);
  });

  it("keeps the final assigned role checked when removal is rejected locally", async () => {
    const user = userEvent.setup();

    render(
      <ManageUsersClient
        initialUsers={[
          {
            email: "user@example.com",
            nickname: "user",
            social: false,
            roleNames: ["ROLE_USER"],
          },
        ]}
      />,
    );

    const roleCheckbox = screen.getByRole("checkbox", { name: "ROLE_USER" });
    expect(roleCheckbox).toBeChecked();

    await user.click(roleCheckbox);

    expect(await screen.findByText("At least one role must remain assigned.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "ROLE_USER" })).toBeChecked();
  });

  it("rolls back an optimistic role toggle when the backend rejects the patch", async () => {
    server.use(
      http.patch("http://localhost:3000/api/admin/users/:email/role", () =>
        HttpResponse.json(
          {
            error: "ERROR_ACCESS_DENIED",
            message: "You do not have permission.",
          },
          { status: 403 },
        ),
      ),
      http.get("http://localhost:3000/api/admin/users", () =>
        HttpResponse.json([
          {
            email: "user@example.com",
            nickname: "user",
            social: false,
            roleNames: ["ROLE_USER"],
          },
        ]),
      ),
    );

    const user = userEvent.setup();

    render(
      <ManageUsersClient
        initialUsers={[
          {
            email: "user@example.com",
            nickname: "user",
            social: false,
            roleNames: ["ROLE_USER"],
          },
        ]}
      />,
    );

    const managerCheckbox = screen.getByRole("checkbox", { name: "ROLE_MANAGER" });
    expect(managerCheckbox).not.toBeChecked();

    await user.click(managerCheckbox);

    await waitFor(() => {
      expect(screen.getByText("ERROR_ACCESS_DENIED")).toBeInTheDocument();
    });
    expect(screen.getByRole("checkbox", { name: "ROLE_MANAGER" })).not.toBeChecked();
  });

  it("persists the updated roles returned by the backend", async () => {
    server.use(
      http.patch("http://localhost:3000/api/admin/users/:email/role", async ({ request }) => {
        const body = (await request.json()) as { roleNames: string[] };

        return HttpResponse.json({
          email: "user@example.com",
          nickname: "user",
          social: false,
          roleNames: body.roleNames,
        });
      }),
    );

    const user = userEvent.setup();

    render(
      <ManageUsersClient
        initialUsers={[
          {
            email: "user@example.com",
            nickname: "user",
            social: false,
            roleNames: ["ROLE_USER"],
          },
        ]}
      />,
    );

    const managerCheckbox = screen.getByRole("checkbox", { name: "ROLE_MANAGER" });
    await user.click(managerCheckbox);

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "ROLE_MANAGER" })).toBeChecked();
    });
  });
});
