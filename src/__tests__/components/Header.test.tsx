/**
 * Tests de componente: Header
 *
 * Verifica la navegación, el badge del carrito,
 * y el estado de autenticación (logueado vs no logueado).
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "@/components/Header";

// Mock de next/link
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

// Mock de next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock de Supabase
const mockSignOut = jest.fn().mockResolvedValue({});
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  }),
}));

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

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renderiza el nombre de la tienda 'Mi Tienda'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<Header />);

    expect(screen.getByText("Mi Tienda")).toBeInTheDocument();
  });

  test("el logo enlaza a la página principal '/'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<Header />);

    const logo = screen.getByText("Mi Tienda");
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  test("muestra enlace al carrito con texto '🛒 Carrito'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<Header />);

    expect(screen.getByText(/Carrito/)).toBeInTheDocument();
  });

  test("el enlace del carrito apunta a /carrito", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<Header />);

    const cartLink = screen.getByText(/Carrito/).closest("a");
    expect(cartLink).toHaveAttribute("href", "/carrito");
  });

  test("cuando NO hay sesión, muestra 'Iniciar Sesión' y 'Registrarse'", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
      expect(screen.getByText("Registrarse")).toBeInTheDocument();
    });
  });

  test("cuando HAY sesión, muestra el email del usuario y 'Cerrar Sesión'", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { email: "admin@tienda.com" } },
      },
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText("admin@tienda.com")).toBeInTheDocument();
      expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
    });
  });

  test("cuando HAY sesión, NO muestra 'Iniciar Sesión' ni 'Registrarse'", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { email: "user@test.com" } },
      },
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.queryByText("Iniciar Sesión")).not.toBeInTheDocument();
      expect(screen.queryByText("Registrarse")).not.toBeInTheDocument();
    });
  });

  test("al hacer click en 'Cerrar Sesión' se llama a signOut y redirige a /login", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { email: "user@test.com" } },
      },
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Cerrar Sesión"));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  test("muestra el badge del carrito cuando hay items en localStorage", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    // Simular 2 items en el carrito (cantidad total = 3)
    localStorageMock._setStore({
      mi_tienda_carrito: JSON.stringify([
        { id: "1", name: "Whisky", quantity: 2 },
        { id: "2", name: "Ron", quantity: 1 },
      ]),
    });

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});

