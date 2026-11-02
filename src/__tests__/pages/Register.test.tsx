/**
 * Tests de página: Register (/register)
 *
 * Verifica el renderizado del formulario de registro,
 * validaciones de reCAPTCHA y flujo de creación de cuenta.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegisterPage from "@/app/register/page";

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
}));

// Mock de reCAPTCHA
const mockExecuteRecaptcha = jest.fn();
jest.mock("react-google-recaptcha-v3", () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: mockExecuteRecaptcha }),
}));

// Mock de Supabase
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

import { supabase } from "@/lib/supabase/client";
const mockSignUp = supabase.auth.signUp as jest.Mock;

// Mock de la Server Action verifyRecaptcha
jest.mock("@/app/actions/recaptcha", () => ({
  verifyRecaptcha: jest.fn(),
}));

import { verifyRecaptcha } from "@/app/actions/recaptcha";
const mockVerifyRecaptcha = verifyRecaptcha as jest.MockedFunction<typeof verifyRecaptcha>;

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza el título 'Crear Cuenta'", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
  });

  test("renderiza los campos de nombre, email y contraseña", () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText("Tu nombre")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("tucorreo@ejemplo.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  test("renderiza el botón 'Registrarse'", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Registrarse")).toBeInTheDocument();
  });

  test("tiene enlace 'Inicia sesión' que apunta a /login", () => {
    render(<RegisterPage />);
    const link = screen.getByText("Inicia sesión");
    expect(link).toHaveAttribute("href", "/login");
  });

  test("tiene enlace '← Volver al inicio' que apunta a /", () => {
    render(<RegisterPage />);
    const link = screen.getByText("← Volver al inicio");
    expect(link).toHaveAttribute("href", "/");
  });

  test("muestra error si reCAPTCHA detecta actividad sospechosa", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockResolvedValue(false);

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("Tu nombre"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(
        screen.getByText(/Registro bloqueado: Actividad sospechosa detectada/)
      ).toBeInTheDocument();
    });

    // No debería haber llamado a signUp
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  test("registro exitoso redirige a / con router.push", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockResolvedValue(true);
    mockSignUp.mockResolvedValue({ data: { user: { id: "123" } }, error: null });

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("Tu nombre"), {
      target: { value: "Nuevo Usuario" },
    });
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.com"), {
      target: { value: "nuevo@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "nuevo@test.com",
        password: "pass123",
        options: { data: { full_name: "Nuevo Usuario" } },
      });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("el botón muestra 'Verificando y registrando...' durante el proceso", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockImplementation(() => new Promise(() => {}));

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("Tu nombre"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.com"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(screen.getByText("Verificando y registrando...")).toBeInTheDocument();
    });
  });

  test("muestra error cuando Supabase lanza un error", async () => {
    mockExecuteRecaptcha.mockResolvedValue("fake-token");
    mockVerifyRecaptcha.mockResolvedValue(true);
    mockSignUp.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("Tu nombre"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("tucorreo@ejemplo.com"), {
      target: { value: "existe@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("Registrarse"));

    await waitFor(() => {
      expect(screen.getByText("User already registered")).toBeInTheDocument();
    });
  });
});

