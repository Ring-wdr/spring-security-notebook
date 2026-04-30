import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ManageContentClient } from "./manage-content-client";

const navigation = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  router: {
    refresh: vi.fn(),
    replace: vi.fn(),
  },
  searchParams: new URLSearchParams(),
}));

const contentActions = vi.hoisted(() => ({
  saveManagedContentAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("@/app/actions/content", () => ({
  initialSaveContentFormState: {
    status: "idle",
    message: null,
    error: null,
  },
  saveManagedContentAction: contentActions.saveManagedContentAction,
}));

describe("ManageContentClient", () => {
  beforeEach(() => {
    navigation.refresh.mockReset();
    navigation.replace.mockReset();
    navigation.router.refresh = navigation.refresh;
    navigation.router.replace = navigation.replace;
    navigation.searchParams = new URLSearchParams();
    contentActions.saveManagedContentAction.mockReset();
  });

  it("renders one dossier workspace with an editor section and content registry", () => {
    const { container } = render(
      <ManageContentClient
        initialItems={[
          {
            id: 1,
            title: "JWT Basics",
            category: "security",
            published: true,
          },
        ]}
        selectedDetail={null}
      />,
    );

    expect(container.querySelectorAll(".dossier-surface")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Create or update content" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Content registry" }),
    ).toBeInTheDocument();
  });

  it("renders a server-selected content detail in the editor", () => {
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
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Understand the filter chain before token parsing.",
          category: "security",
          published: false,
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("JWT Basics");
    expect(screen.getByLabelText("Category")).toHaveValue("security");
    expect(screen.getByLabelText("Body")).toHaveValue(
      "Understand the filter chain before token parsing.",
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Update content" })).toBeEnabled();
  });

  it("updates the URL query when selecting a registry item", async () => {
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
        selectedDetail={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /jwt basics/i }));

    expect(navigation.replace).toHaveBeenCalledWith("/manage/content?contentId=1");
  });

  it("preserves existing URL query values when selecting a registry item", async () => {
    navigation.searchParams = new URLSearchParams("page=2");
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
        selectedDetail={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /jwt basics/i }));

    expect(navigation.replace).toHaveBeenCalledWith(
      "/manage/content?page=2&contentId=1",
    );
  });

  it("updates the editor when the server-selected content detail changes", () => {
    const initialItems = [
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: true,
      },
      {
        id: 2,
        title: "Filter Chain",
        category: "filters",
        published: false,
      },
    ];

    const { rerender } = render(
      <ManageContentClient
        initialItems={initialItems}
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Understand token parsing.",
          category: "security",
          published: false,
        }}
      />,
    );

    rerender(
      <ManageContentClient
        initialItems={initialItems}
        selectedDetail={{
          id: 2,
          title: "Filter Chain",
          body: "Place authentication filters deliberately.",
          category: "filters",
          published: true,
        }}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Filter Chain");
    expect(screen.getByLabelText("Category")).toHaveValue("filters");
    expect(screen.getByLabelText("Body")).toHaveValue(
      "Place authentication filters deliberately.",
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("button", { name: "Update content" })).toBeEnabled();
  });

  it("resets the editor when the server-selected content detail is cleared", () => {
    const initialItems = [
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: true,
      },
    ];

    const { rerender } = render(
      <ManageContentClient
        initialItems={initialItems}
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Understand token parsing.",
          category: "tokens",
          published: false,
        }}
      />,
    );

    rerender(
      <ManageContentClient initialItems={initialItems} selectedDetail={null} />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("security");
    expect(screen.getByLabelText("Body")).toHaveValue("");
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("button", { name: "Create content" })).toBeEnabled();
  });

  it("syncs the content registry when server-rendered items change", () => {
    const { rerender } = render(
      <ManageContentClient
        initialItems={[
          {
            id: 1,
            title: "JWT Basics",
            category: "security",
            published: true,
          },
        ]}
        selectedDetail={null}
      />,
    );

    rerender(
      <ManageContentClient
        initialItems={[
          {
            id: 2,
            title: "Refresh Rotation",
            category: "tokens",
            published: false,
          },
        ]}
        selectedDetail={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: /refresh rotation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /jwt basics/i }),
    ).not.toBeInTheDocument();
  });

  it("creates content with the Server Action and refreshes the route after success", async () => {
    contentActions.saveManagedContentAction.mockResolvedValueOnce({
      status: "success",
      message: "Content created.",
      error: null,
      contentId: 2,
    });
    const user = userEvent.setup();

    render(<ManageContentClient initialItems={[]} selectedDetail={null} />);

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Refresh Rotation");
    await user.clear(screen.getByLabelText("Category"));
    await user.type(screen.getByLabelText("Category"), "tokens");
    await user.clear(screen.getByLabelText("Body"));
    await user.type(
      screen.getByLabelText("Body"),
      "Rotate the refresh token before it is too close to expiry.",
    );
    await user.click(screen.getByRole("button", { name: "Create content" }));

    expect(await screen.findByText("Content created.")).toBeInTheDocument();
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(contentActions.saveManagedContentAction).toHaveBeenCalledTimes(1),
    );

    const submittedFormData =
      contentActions.saveManagedContentAction.mock.calls[0]?.[1];
    expect(submittedFormData).toBeInstanceOf(FormData);
    expect(submittedFormData.get("id")).toBe("");
    expect(submittedFormData.get("title")).toBe("Refresh Rotation");
    expect(submittedFormData.get("category")).toBe("tokens");
    expect(submittedFormData.get("published")).toBe("true");
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create content" })).toBeEnabled();
  });

  it("updates content with the Server Action and refreshes the route after success", async () => {
    navigation.searchParams = new URLSearchParams("contentId=1");
    contentActions.saveManagedContentAction.mockResolvedValueOnce({
      status: "success",
      message: "Content updated.",
      error: null,
      contentId: 1,
    });
    const user = userEvent.setup();

    render(
      <ManageContentClient
        initialItems={[
          {
            id: 1,
            title: "JWT Basics",
            category: "security",
            published: false,
          },
        ]}
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: false,
        }}
      />,
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "JWT Refresh");
    await user.clear(screen.getByLabelText("Body"));
    await user.type(screen.getByLabelText("Body"), "Updated body");
    await user.click(screen.getByRole("button", { name: "Update content" }));

    expect(await screen.findByText("Content updated.")).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/manage/content");
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));

    const submittedFormData =
      contentActions.saveManagedContentAction.mock.calls[0]?.[1];
    expect(submittedFormData).toBeInstanceOf(FormData);
    expect(submittedFormData.get("id")).toBe("1");
    expect(submittedFormData.get("title")).toBe("JWT Refresh");
    expect(submittedFormData.get("body")).toBe("Updated body");
    expect(submittedFormData.get("published")).toBe("false");
    expect(screen.getByRole("button", { name: "Create content" })).toBeEnabled();
  });

  it("removes only selected content query after update success", async () => {
    navigation.searchParams = new URLSearchParams("page=2&contentId=1");
    contentActions.saveManagedContentAction.mockResolvedValueOnce({
      status: "success",
      message: "Content updated.",
      error: null,
      contentId: 1,
    });
    const user = userEvent.setup();

    const initialItems = [
      {
        id: 1,
        title: "JWT Basics",
        category: "security",
        published: false,
      },
    ];

    const { rerender } = render(
      <ManageContentClient
        initialItems={initialItems}
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: false,
        }}
      />,
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "JWT Refresh");
    await user.click(screen.getByRole("button", { name: "Update content" }));

    expect(await screen.findByText("Content updated.")).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/manage/content?page=2");
    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Title")).toHaveValue("");

    rerender(
      <ManageContentClient initialItems={initialItems} selectedDetail={null} />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("security");
    expect(screen.getByLabelText("Body")).toHaveValue("");
  });

  it("refreshes the route after consecutive successful saves", async () => {
    contentActions.saveManagedContentAction
      .mockResolvedValueOnce({
        status: "success",
        message: "Content updated.",
        error: null,
        contentId: 1,
      })
      .mockResolvedValueOnce({
        status: "success",
        message: "Content updated.",
        error: null,
        contentId: 1,
      });
    const user = userEvent.setup();

    render(
      <ManageContentClient
        initialItems={[]}
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: true,
        }}
      />,
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "JWT Refresh");
    await user.clear(screen.getByLabelText("Body"));
    await user.type(screen.getByLabelText("Body"), "Updated body");
    await user.click(screen.getByRole("button", { name: "Update content" }));

    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText("Title"), "JWT Refresh Again");
    await user.type(screen.getByLabelText("Body"), "Updated body again");
    await user.click(screen.getByRole("button", { name: "Create content" }));

    await waitFor(() => expect(navigation.refresh).toHaveBeenCalledTimes(2));
    expect(contentActions.saveManagedContentAction).toHaveBeenCalledTimes(2);
  });

  it("shows a structured error when saving fails", async () => {
    contentActions.saveManagedContentAction.mockResolvedValueOnce({
      status: "error",
      message: null,
      error: {
        code: "ERROR_BAD_REQUEST",
        message: "Request payload is invalid.",
      },
    });
    const user = userEvent.setup();

    render(<ManageContentClient initialItems={[]} selectedDetail={null} />);

    await user.type(screen.getByLabelText("Title"), "Broken content");
    await user.type(screen.getByLabelText("Body"), "Missing fields");
    await user.click(screen.getByRole("button", { name: "Create content" }));

    expect(await screen.findByText("ERROR_BAD_REQUEST")).toBeInTheDocument();
    expect(screen.getByText("Request payload is invalid.")).toBeInTheDocument();
    expect(navigation.refresh).not.toHaveBeenCalled();
  });

  it("resets the editor back to the empty create state", async () => {
    navigation.searchParams = new URLSearchParams("page=2&contentId=1");
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
        selectedDetail={{
          id: 1,
          title: "JWT Basics",
          body: "Old body",
          category: "security",
          published: false,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Update content" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("security");
    expect(screen.getByLabelText("Body")).toHaveValue("");
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("button", { name: "Create content" })).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenCalledWith("/manage/content?page=2");
  });
});
