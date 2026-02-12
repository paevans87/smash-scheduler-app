import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PricingPage from "./page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockRpc = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: mockRpc }),
}));

describe("PricingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all three plan cards", () => {
    render(<PricingPage />);

    expect(screen.getByRole("button", { name: "Select Free" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coming Soon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Free Trial" })).toBeInTheDocument();
  });

  it("renders club name input", () => {
    render(<PricingPage />);

    expect(screen.getByLabelText("Club Name")).toBeInTheDocument();
  });

  it("shows error when selecting a plan without club name", async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    await user.click(screen.getByRole("button", { name: "Select Free" }));

    expect(
      screen.getByText("Please enter a club name.")
    ).toBeInTheDocument();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("has Pro button disabled with Coming Soon label", () => {
    render(<PricingPage />);

    expect(
      screen.getByRole("button", { name: "Coming Soon" })
    ).toBeDisabled();
  });

  it("calls RPC and redirects on successful Free plan selection", async () => {
    mockRpc.mockResolvedValue({ data: "some-uuid", error: null });
    const user = userEvent.setup();

    render(<PricingPage />);

    await user.type(screen.getByLabelText("Club Name"), "Shuttle Stars");
    await user.click(screen.getByRole("button", { name: "Select Free" }));

    expect(mockRpc).toHaveBeenCalledWith("create_club_with_subscription", {
      p_club_name: "Shuttle Stars",
      p_plan_type: "free",
      p_status: "active",
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls RPC with trialling status for Pro Trial", async () => {
    mockRpc.mockResolvedValue({ data: "some-uuid", error: null });
    const user = userEvent.setup();

    render(<PricingPage />);

    await user.type(screen.getByLabelText("Club Name"), "Racket Rebels");
    await user.click(
      screen.getByRole("button", { name: "Start Free Trial" })
    );

    expect(mockRpc).toHaveBeenCalledWith("create_club_with_subscription", {
      p_club_name: "Racket Rebels",
      p_plan_type: "pro",
      p_status: "trialling",
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("displays RPC error message", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Something went wrong" },
    });
    const user = userEvent.setup();

    render(<PricingPage />);

    await user.type(screen.getByLabelText("Club Name"), "Test Club");
    await user.click(screen.getByRole("button", { name: "Select Free" }));

    expect(
      screen.getByText("Something went wrong")
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("trims whitespace from club name", async () => {
    mockRpc.mockResolvedValue({ data: "some-uuid", error: null });
    const user = userEvent.setup();

    render(<PricingPage />);

    await user.type(screen.getByLabelText("Club Name"), "  Padded Name  ");
    await user.click(screen.getByRole("button", { name: "Select Free" }));

    expect(mockRpc).toHaveBeenCalledWith("create_club_with_subscription", {
      p_club_name: "Padded Name",
      p_plan_type: "free",
      p_status: "active",
    });
  });
});
