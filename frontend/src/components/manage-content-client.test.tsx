import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { ManageContentClient } from "./manage-content-client";
import { server } from "@/test/msw/server";

describe("ManageContentClient", () => {
  it("loads selected content details into the editor", async () => {
    server.use(
      http.get("http://localhost:3000/api/content/:id", ({ params }) => {
        if (params.id !== "1") {
          return HttpResponse.json(
            {
              error: "ERROR_CONTENT_NOT_FOUND",
              message: "Content was not found.",
            },
            { status: 404 },
          );
        }

        return HttpResponse.json({
          id: 1,
          title: "JWT Basics",
          body: "Understand the filter chain before token parsing.",
          category: "security",
          published: false,
        });
      }),
    );

    const user = userEvent.setup();

    render(
      <ManageContentClient
        initialItems={[
          {
            id: 1,
            title: "JWT Basics",
            category: "security",
            published: true,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /jwt basics/i }));

    expect(await screen.findByDisplayValue("JWT Basics")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Understand the filter chain before token parsing.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("security")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update content" })).toBeEnabled();
  });

  it("creates content and refreshes the content list", async () => {
    const contents = [
      {
        id: 1,
        title: "Security Config",
        category: "security",
        published: true,
      },
    ];

    server.use(
      http.post("http://localhost:3000/api/content", async ({ request }) => {
        const body = (await request.json()) as {
          title: string;
          body: string;
          category: string;
          published: boolean;
        };

        contents.push({
          id: 2,
          title: body.title,
          category: body.category,
          published: body.published,
        });

        return HttpResponse.json(
          {
            id: 2,
            ...body,
          },
          { status: 201 },
        );
      }),
      http.get("http://localhost:3000/api/content", () =>
        HttpResponse.json(contents),
      ),
    );

    const user = userEvent.setup();

    render(<ManageContentClient initialItems={contents} />);

    await user.clear(screen.getByPlaceholderText("Title"));
    await user.type(screen.getByPlaceholderText("Title"), "Refresh Rotation");
    await user.clear(screen.getByPlaceholderText("Category"));
    await user.type(screen.getByPlaceholderText("Category"), "tokens");
    await user.clear(screen.getByPlaceholderText("Body"));
    await user.type(
      screen.getByPlaceholderText("Body"),
      "Rotate the refresh token before it is too close to expiry.",
    );
    await user.click(screen.getByRole("button", { name: "Create content" }));

    expect(await screen.findByText("Content created.")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /refresh rotation/i }),
      ).toBeInTheDocument();
    });
  });

  it("updates an existing item and reloads the listing", async () => {
    const contents = [
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: false,
      },
    ];

    server.use(
      http.get("http://localhost:3000/api/content/:id", () =>
        HttpResponse.json({
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: false,
        }),
      ),
      http.put("http://localhost:3000/api/content/:id", async ({ request }) => {
        const body = (await request.json()) as {
          title: string;
          body: string;
          category: string;
          published: boolean;
        };

        contents[0] = {
          id: 1,
          title: body.title,
          category: body.category,
          published: body.published,
        };

        return HttpResponse.json({
          id: 1,
          ...body,
        });
      }),
      http.get("http://localhost:3000/api/content", () =>
        HttpResponse.json(contents),
      ),
    );

    const user = userEvent.setup();

    render(<ManageContentClient initialItems={contents} />);

    await user.click(screen.getByRole("button", { name: /jwt basics/i }));
    await user.clear(await screen.findByPlaceholderText("Title"));
    await user.type(screen.getByPlaceholderText("Title"), "JWT Refresh");
    await user.clear(screen.getByPlaceholderText("Body"));
    await user.type(screen.getByPlaceholderText("Body"), "Updated body");
    await user.click(screen.getByRole("button", { name: "Update content" }));

    expect(await screen.findByText("Content updated.")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /jwt refresh/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Create content" })).toBeEnabled();
  });

  it("shows a structured error when saving fails", async () => {
    server.use(
      http.post("http://localhost:3000/api/content", () =>
        HttpResponse.json(
          {
            error: "ERROR_BAD_REQUEST",
            message: "Request payload is invalid.",
          },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();

    render(<ManageContentClient initialItems={[]} />);

    await user.type(screen.getByPlaceholderText("Title"), "Broken content");
    await user.type(screen.getByPlaceholderText("Body"), "Missing fields");
    await user.click(screen.getByRole("button", { name: "Create content" }));

    expect(await screen.findByText("ERROR_BAD_REQUEST")).toBeInTheDocument();
    expect(screen.getByText("Request payload is invalid.")).toBeInTheDocument();
  });

  it("resets the editor back to the empty create state", async () => {
    server.use(
      http.get("http://localhost:3000/api/content/:id", () =>
        HttpResponse.json({
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: false,
        }),
      ),
    );

    const user = userEvent.setup();

    render(
      <ManageContentClient
        initialItems={[
          {
            id: 1,
            title: "JWT Basics",
            category: "security",
            published: true,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /jwt basics/i }));
    expect(await screen.findByRole("button", { name: "Update content" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByPlaceholderText("Title")).toHaveValue("");
    expect(screen.getByPlaceholderText("Category")).toHaveValue("security");
    expect(screen.getByPlaceholderText("Body")).toHaveValue("");
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("button", { name: "Create content" })).toBeInTheDocument();
  });
});
