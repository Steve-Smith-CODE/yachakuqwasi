import { describe, it, expect } from "vitest";
import { fileToDataUrl } from "./files.js";

describe("fileToDataUrl", () => {
  it("convierte un archivo en un data URL", async () => {
    const file = new File(["contenido"], "foto.txt", { type: "text/plain" });

    const result = await fileToDataUrl(file);

    expect(result).toMatch(/^data:text\/plain;base64,/);
  });

  it("conserva el tipo MIME del archivo en el data URL", async () => {
    const file = new File(["\x89PNG"], "imagen.png", { type: "image/png" });

    const result = await fileToDataUrl(file);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it("rechaza la promesa si falla la lectura del archivo", async () => {
    const file = new File(["x"], "roto.txt", { type: "text/plain" });
    const originalReadAsDataURL = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function () {
      this.onerror(new Error("No se pudo leer"));
    };

    try {
      await expect(fileToDataUrl(file)).rejects.toBeInstanceOf(Error);
    } finally {
      FileReader.prototype.readAsDataURL = originalReadAsDataURL;
    }
  });
});
