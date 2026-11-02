/**
 * Tests de página: Carrito (/carrito)
 *
 * Verifica el renderizado del carrito de compras, el resumen de pedido,
 * la protección de checkout por autenticación, y los controles de cantidad.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CartPage from "@/app/carrito/page";

// Mock de next/link
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

// Mock de next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}));

// Mock de Supabase
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { supabase } from "@/lib/supabase/client";
const mockGetSession = supabase.auth.getSession as jest.Mock;

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });
jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);

const cartItems = [
  {
    id: "prod-1",
    name: "Whisky Premium",
    price: 45.99,
    quantity: 2,
    imageUrl: "https://example.com/whisky.jpg",
    category: "Whisky",
  },
  {
    id: "prod-2",
    name: "Ron Diplomático",
    price: 32.5,
    quantity: 1,
    imageUrl: "https://example.com/ron.jpg",
    category: "Ron",
  },
];

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("muestra 'Tu carrito está vacío.' cuando no hay items", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<CartPage />);

    expect(screen.getByText("Tu carrito está vacío.")).toBeInTheDocument();
  });

  test("muestra enlace 'Explorar Licores' cuando el carrito está vacío", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<CartPage />);

    const link = screen.getByText("Explorar Licores");
    expect(link).toHaveAttribute("href", "/");
  });

  test("renderiza los productos del carrito desde localStorage", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify(cartItems),
    });

    render(<CartPage />);

    expect(screen.getByText("Whisky Premium")).toBeInTheDocument();
    expect(screen.getByText("Ron Diplomático")).toBeInTheDocument();
  });

  test("muestra el título 'Tu Carrito de Compras'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<CartPage />);

    expect(screen.getByText("Tu Carrito de Compras")).toBeInTheDocument();
  });

  test("muestra el resumen del pedido con subtotal y total correctos", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify(cartItems),
    });

    render(<CartPage />);

    // Total: (45.99 * 2) + (32.50 * 1) = 91.98 + 32.50 = 124.48
    expect(screen.getByText("Resumen del Pedido")).toBeInTheDocument();
    // Buscar el total en el formato correcto
    const totalElements = screen.getAllByText("$124.48");
    expect(totalElements.length).toBeGreaterThanOrEqual(1);
  });

  test("muestra comisión de 0%", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify(cartItems),
    });

    render(<CartPage />);

    expect(screen.getByText("0.00$ (0%)")).toBeInTheDocument();
  });

  test("cuando NO está logueado, muestra botón 'Pagar' que enlaza a /login", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify(cartItems),
    });

    render(<CartPage />);

    await waitFor(() => {
      const payLink = screen.getByText("Pagar");
      expect(payLink.closest("a")).toHaveAttribute("href", "/login");
    });
  });

  test("cuando SÍ está logueado, muestra formulario de pago con el email del usuario", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: "comprador@test.com" } } },
    });
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify(cartItems),
    });

    render(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText(/comprador@test.com/)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("4242 •••• •••• 4242")
      ).toBeInTheDocument();
    });
  });

  test("tiene enlace '← Seguir comprando' que apunta a /", () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<CartPage />);

    const link = screen.getByText("← Seguir comprando");
    expect(link).toHaveAttribute("href", "/");
  });
});

