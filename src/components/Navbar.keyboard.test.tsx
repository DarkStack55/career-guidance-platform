import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Minimal router stubs so the nav can render outside a RouterProvider.
vi.mock("@tanstack/react-router", () => ({
  Link: React.forwardRef<HTMLAnchorElement, any>(function Link(
    { to, children, ...rest },
    ref,
  ) {
    return (
      <a ref={ref} href={to} {...rest}>
        {children}
      </a>
    );
  }),
  useNavigate: () => vi.fn(),
  useRouterState: () => "/",
}));

import { DesktopMegaMenu } from "./Navbar";

const menu = (label: string) =>
  document.querySelector(`[role="menu"][aria-label="${label}"]`) as HTMLElement;
const trigger = (label: string) =>
  screen.getByRole("link", { name: new RegExp(`^${label}$`) });

const itemsOf = (label: string) =>
  Array.from(menu(label).querySelectorAll('[role="menuitem"]')) as HTMLElement[];

const isOpen = (label: string) => menu(label).getAttribute("aria-hidden") === "false";

describe("DesktopMegaMenu keyboard navigation", () => {
  beforeEach(() => {
    render(<DesktopMegaMenu path="/" />);
  });

  it("opens a menu with ArrowDown and focuses the first subcategory", async () => {
    const user = userEvent.setup();
    trigger("Home").focus();
    await user.keyboard("{ArrowDown}");

    expect(isOpen("Home")).toBe(true);
    expect(itemsOf("Home")[0]).toHaveFocus();
  });

  it("opens a menu with ArrowUp and focuses the last subcategory", async () => {
    const user = userEvent.setup();
    trigger("Home").focus();
    await user.keyboard("{ArrowUp}");

    const items = itemsOf("Home");
    expect(items[items.length - 1]).toHaveFocus();
  });

  it("moves through subcategories with ArrowDown/ArrowUp and wraps around", async () => {
    const user = userEvent.setup();
    trigger("Assessment").focus();
    await user.keyboard("{ArrowDown}");

    const items = itemsOf("Assessment");
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(items[items.length - 1]).toHaveFocus();
  });

  it("jumps to first/last subcategory with Home/End", async () => {
    const user = userEvent.setup();
    trigger("Roadmap").focus();
    await user.keyboard("{ArrowDown}");

    const items = itemsOf("Roadmap");
    await user.keyboard("{End}");
    expect(items[items.length - 1]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("moves between top-level items with ArrowRight/ArrowLeft", async () => {
    const user = userEvent.setup();
    trigger("Home").focus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Assessment")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(trigger("Home")).toHaveFocus();
  });

  it("closes with Escape from the trigger", async () => {
    const user = userEvent.setup();
    trigger("Mentors").focus();
    await user.keyboard("{ArrowDown}");
    expect(isOpen("Mentors")).toBe(true);

    trigger("Mentors").focus();
    await user.keyboard("{Escape}");
    expect(isOpen("Mentors")).toBe(false);
  });

  it("closes with Escape from a subcategory and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    trigger("Blog").focus();
    await user.keyboard("{ArrowDown}");
    expect(itemsOf("Blog")[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(isOpen("Blog")).toBe(false);
    expect(trigger("Blog")).toHaveFocus();
  });

  it("keeps closed menus hidden and untabbable", () => {
    expect(isOpen("Internships")).toBe(false);
    for (const item of itemsOf("Internships")) {
      expect(item).toHaveAttribute("tabindex", "-1");
    }
  });

  it("marks the trigger expanded state for assistive tech", async () => {
    const user = userEvent.setup();
    const t = trigger("Scholarships");
    expect(t).toHaveAttribute("aria-expanded", "false");
    t.focus();
    await user.keyboard("{ArrowDown}");
    expect(t).toHaveAttribute("aria-expanded", "true");
  });
});
