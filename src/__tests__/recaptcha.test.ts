/**
 * Tests para: src/app/actions/recaptcha.ts — verifyRecaptcha
 *
 * Verificamos que la función valide correctamente los tokens
 * de reCAPTCHA llamando a la API de Google.
 */

// Mock de fetch global — simulamos las llamadas HTTP a Google
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Importamos la función a testear
import { verifyRecaptcha } from "@/app/actions/recaptcha";

describe("verifyRecaptcha", () => {
  // Guardamos el env original y limpiamos mocks
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: "test-secret-key" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("retorna TRUE cuando Google responde success con score >= 0.5", async () => {
    // Simulamos respuesta exitosa de Google
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, score: 0.9 }),
    } as Response);

    const result = await verifyRecaptcha("token-valido");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({
        method: "POST",
        body: "secret=test-secret-key&response=token-valido",
      })
    );
  });

  test("retorna FALSE cuando el score es menor a 0.5 (probable bot)", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, score: 0.3 }),
    } as Response);

    const result = await verifyRecaptcha("token-sospechoso");

    expect(result).toBe(false);
  });

  test("retorna FALSE cuando Google responde success: false", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: false, score: 0.9 }),
    } as Response);

    const result = await verifyRecaptcha("token-invalido");

    expect(result).toBe(false);
  });

  test("retorna FALSE cuando NO existe la variable RECAPTCHA_SECRET_KEY", async () => {
    // Eliminamos la variable de entorno
    delete process.env.RECAPTCHA_SECRET_KEY;

    const result = await verifyRecaptcha("cualquier-token");

    expect(result).toBe(false);
    // No debería haber llamado a fetch sin la key
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("retorna FALSE cuando fetch lanza un error de red", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await verifyRecaptcha("token-con-error");

    expect(result).toBe(false);
  });

  test("retorna TRUE con score exactamente 0.5 (límite)", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ success: true, score: 0.5 }),
    } as Response);

    const result = await verifyRecaptcha("token-limite");

    expect(result).toBe(true);
  });
});

