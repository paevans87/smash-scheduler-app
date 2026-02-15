import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnboardingPage from "./page";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders both cards", () => {
    render(<OnboardingPage />);

    expect(screen.getByText("Accept an Invite")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join Club" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create a Club" })).toBeInTheDocument();
  });

  it("renders invite code input", () => {
    render(<OnboardingPage />);

    expect(screen.getByLabelText("Invite Code")).toBeInTheDocument();
  });

  it("pre-fills invite code from query param", () => {
    mockSearchParams = new URLSearchParams("code=ABC123");

    render(<OnboardingPage />);

    expect(screen.getByLabelText("Invite Code")).toHaveValue("ABC123");
  });

  it("has disabled Join Club button", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("button", { name: "Join Club" })).toBeDisabled();
  });

  it("navigates to /pricing when Create a Club is clicked", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(
      screen.getByRole("button", { name: "Create a Club" })
    );

    expect(mockPush).toHaveBeenCalledWith("/pricing");
  });
});
