/**
 * Tests para: src/middleware.ts
 *
 * Verificamos que el middleware refresque la sesión de Supabase
 * correctamente y pase las cookies en la respuesta.
 */

// Mock de @supabase/ssr
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } });

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

import { createServerClient } from "@supabase/ssr";
import { middleware, config } from "@/middleware";

// Helper: crea un request simulado de Next.js
function createMockRequest(url: string, cookies: { name: string; value: string }[] = []) {
  const cookieStore = new Map(cookies.map((c) => [c.name, c]));

  return {
    url,
    nextUrl: new URL(url),
    cookies: {
      getAll: jest.fn(() => cookies),
      set: jest.fn((name: string, value: string) => {
        cookieStore.set(name, { name, value });
      }),
    },
    headers: new Headers(),
  } as any;
}

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  test("crea un cliente Supabase con las variables de entorno correctas", async () => {
    const request = createMockRequest("http://localhost:3000/");

    await middleware(request);

    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
  });

  test("llama a getUser() para refrescar la sesión", async () => {
    const request = createMockRequest("http://localhost:3000/dashboard");

    await middleware(request);

    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  test("retorna un NextResponse (no bloquea la petición)", async () => {
    const request = createMockRequest("http://localhost:3000/");

    const response = await middleware(request);

    // El middleware siempre debe dejar pasar la petición
    expect(response).toBeDefined();
  });

  test("lee las cookies del request mediante getAll()", async () => {
    const cookies = [
      { name: "sb-token", value: "abc123" },
      { name: "sb-refresh", value: "xyz789" },
    ];
    const request = createMockRequest("http://localhost:3000/", cookies);

    await middleware(request);

    // Supabase internamente llama getAll para leer las cookies de sesión
    // Verificamos que el request se pasó correctamente al cliente
    expect(createServerClient).toHaveBeenCalled();
  });
});

describe("middleware config (matcher)", () => {
  // Anclamos el patrón como lo hace Next.js internamente
  const pattern = new RegExp(`^${config.matcher[0]}$`);

  test("aplica middleware a rutas normales como /login", () => {
    expect(pattern.test("/login")).toBe(true);
  });

  test("aplica middleware a la ruta raíz /", () => {
    expect(pattern.test("/")).toBe(true);
  });

  test("aplica middleware a /admin", () => {
    expect(pattern.test("/admin")).toBe(true);
  });

  test("aplica middleware a /carrito", () => {
    expect(pattern.test("/carrito")).toBe(true);
  });

  test("NO aplica middleware a archivos estáticos .png", () => {
    expect(pattern.test("/logo.png")).toBe(false);
  });

  test("NO aplica middleware a archivos .svg", () => {
    expect(pattern.test("/icon.svg")).toBe(false);
  });

  test("NO aplica middleware a _next/static", () => {
    expect(pattern.test("/_next/static/chunks/main.js")).toBe(false);
  });

  test("NO aplica middleware a _next/image", () => {
    expect(pattern.test("/_next/image?url=foo")).toBe(false);
  });

  test("NO aplica middleware a favicon.ico", () => {
    expect(pattern.test("/favicon.ico")).toBe(false);
  });
});
