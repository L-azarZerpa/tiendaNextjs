/**
 * Tests de página: Login (/login)
 *
 * Verifica el renderizado del formulario, validaciones,
 * flujo de reCAPTCHA y autenticación con Supabase.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/login/page";

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

// Mock de reCAPTCHA
const mockExecuteRecaptcha = jest.fn();
jest.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: mockExecuteRecaptcha }),
}));

// Mock de Supabase
const mockSignInWithPassword = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

// Mock de la Server Action verifyRecaptcha
jest.mock("@/app/actions/recaptcha", () => ({
  verifyRecaptcha: jest.fn(),
}));

import { verifyRecaptcha } from "@/app/actions/recaptcha";
const mockVerifyRecaptcha = verifyRecaptcha as jest.MockedFunction<typeof verifyRecaptcha>;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza el título 'Iniciar Sesión'", () => {
    render(<LoginPage />);
    expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
  });

  test("renderiza campos de email y contraseña", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("tu@correo.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  test("renderiza el botón 'Entrar'", () => {
    render(<LoginPage />);
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  test("tiene enlace '¿Olvidaste tu contraseña?' que apunta a /forgot-password", () => {
    render(<LoginPage />);
    const link = screen.getByText("¿Olvidaste tu contraseña?");
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  test("tiene enlace 'Regístrate aquí' que apunta a /register", () => {
    render(<LoginPage />);
    const link = screen.getByText("Regístrate aquí");
    expect(link).toHaveAttribute("href", "/register");
  });

  test("tiene enlace '← Volver al inicio' que apunta a /", () => {
    render(<LoginPage />);
    const link = screen.getByText("← Volver al inicio");
    expect(link).toHaveAttribute("href", "/");
  });

  test("muestra error si reCAPTCHA falla (bot detectado)", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockResolvedValue(false);

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("tu@correo.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(
        screen.getByText(/Actividad sospechosa detectada/)
      ).toBeInTheDocument();
    });

    // No debería haber llamado a Supabase
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  test("muestra error de Supabase si las credenciales son incorrectas", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockResolvedValue(true);
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("tu@correo.com"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
  });

  test("el botón muestra 'Verificando e iniciando...' mientras carga", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    // No resolvemos verifyRecaptcha para que quede en loading
    mockVerifyRecaptcha.mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("tu@correo.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText("Verificando e iniciando...")).toBeInTheDocument();
    });
  });
});

