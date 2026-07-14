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
  it("muestra el numero directamente, sin necesitar ningun clic", () => {
    render(<PhoneContactPopover phone="966123456" />);

    expect(screen.getByText("966123456")).toBeInTheDocument();
    expect(screen.queryByText("Llamar")).not.toBeInTheDocument();
  });

  it("el numero es un link tel: con el numero correcto", () => {
    render(<PhoneContactPopover phone="966123456" />);

    const telLink = screen.getByText("966123456").closest("a");
    expect(telLink.getAttribute("href")).toBe("tel:966123456");
  });

  it("copiar llama a navigator.clipboard.writeText y muestra Copiado", async () => {
    render(<PhoneContactPopover phone="966123456" />);

    fireEvent.click(screen.getByRole("button", { name: /copiar número/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("966123456");
    expect(await screen.findByText("Copiado")).toBeInTheDocument();
  });

  it("el aviso de Copiado desaparece despues de un tiempo", async () => {
    render(<PhoneContactPopover phone="966123456" />);

    fireEvent.click(screen.getByRole("button", { name: /copiar número/i }));
    expect(await screen.findByText("Copiado")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("Copiado")).not.toBeInTheDocument(), { timeout: 2500 });
  });

  it("el click no se propaga a un contenedor clicable (ej. la card completa)", () => {
    const onCardClick = vi.fn();
    render(
      <div onClick={onCardClick}>
        <PhoneContactPopover phone="966123456" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: /copiar número/i }));

    expect(onCardClick).not.toHaveBeenCalled();
  });
});
