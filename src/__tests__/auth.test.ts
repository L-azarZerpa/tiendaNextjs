/**
 * Tests para: src/lib/auth.ts — checkIsAdmin
 *
 * Verificamos que la función checkIsAdmin retorne true/false
 * correctamente según el rol del usuario en la base de datos.
 */

// Mock de Prisma — simulamos la base de datos
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Importamos DESPUÉS del mock para que tome efecto
import { checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tipamos el mock para autocompletado
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;

describe("checkIsAdmin", () => {
  // Limpiamos los mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retorna TRUE cuando el usuario tiene rol ADMIN", async () => {
    // Simulamos que Prisma encuentra un usuario con rol ADMIN
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      email: "admin@tienda.com",
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkIsAdmin("user-123");

    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
    });
  });

  test("retorna FALSE cuando el usuario tiene rol CUSTOMER", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-456",
      email: "cliente@tienda.com",
      role: "CUSTOMER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkIsAdmin("user-456");

    expect(result).toBe(false);
  });

  test("retorna FALSE cuando el usuario NO existe en la BD", async () => {
    // Simulamos que Prisma no encuentra al usuario
    mockFindUnique.mockResolvedValue(null);

    const result = await checkIsAdmin("usuario-inexistente");

    expect(result).toBe(false);
  });

  test("retorna FALSE cuando se pasa un string vacío", async () => {
    const result = await checkIsAdmin("");

    expect(result).toBe(false);
    // No debería ni llamar a Prisma si el ID está vacío
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

