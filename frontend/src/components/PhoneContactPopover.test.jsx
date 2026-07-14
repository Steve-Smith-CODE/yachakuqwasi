import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PhoneContactPopover from "./PhoneContactPopover.jsx";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true
  });
});

describe("PhoneContactPopover", () => {
  it("muestra el boton Llamar y el popover cerrado inicialmente", () => {
    render(<PhoneContactPopover phone="966123456" />);

    expect(screen.getAllByText("Llamar")[0]).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("al hacer click abre el popover con el numero", () => {
    render(<PhoneContactPopover phone="966123456" />);

    fireEvent.click(screen.getByRole("button", { name: /llamar/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("966123456")).toBeInTheDocument();
  });

  it("el link tel: tiene el numero correcto", () => {
    render(<PhoneContactPopover phone="966123456" />);
    fireEvent.click(screen.getByRole("button", { name: /llamar/i }));

    const telLink = screen.getByRole("dialog").querySelector("a[href^='tel:']");
    expect(telLink.getAttribute("href")).toBe("tel:966123456");
  });

  it("copiar llama a navigator.clipboard.writeText y muestra Copiado", async () => {
    render(<PhoneContactPopover phone="966123456" />);
    fireEvent.click(screen.getByRole("button", { name: /llamar/i }));

    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("966123456");
    expect(await screen.findByText("Copiado")).toBeInTheDocument();
  });

  it("Escape cierra el popover", () => {
    render(<PhoneContactPopover phone="966123456" />);
    fireEvent.click(screen.getByRole("button", { name: /llamar/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("un click afuera cierra el popover", () => {
    render(
      <div>
        <PhoneContactPopover phone="966123456" />
        <button>Afuera</button>
      </div>
    );
    fireEvent.click(screen.getByRole("button", { name: /llamar/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("Afuera"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
