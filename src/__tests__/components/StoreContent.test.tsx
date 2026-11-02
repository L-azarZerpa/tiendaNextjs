/**
 * Tests de componente: StoreContent
 *
 * Verifica el renderizado de productos, la funcionalidad del carrito
 * (agregar, incrementar, eliminar) y el mensaje de búsqueda vacía.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import StoreContent from "@/components/StoreContent";

// Mock de next/link — renderiza un <a> normal
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children);
});

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
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock de window.dispatchEvent
const dispatchEventSpy = jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);

// Productos de prueba
const mockProducts = [
  {
    id: "prod-1",
    name: "Whisky Test",
    slug: "whisky-test",
    price: 45.99,
    category: "Whisky",
    imageUrl: "https://example.com/whisky.jpg",
  },
  {
    id: "prod-2",
    name: "Ron Test",
    slug: "ron-test",
    price: 32.5,
    category: "Ron",
    imageUrl: "https://example.com/ron.jpg",
  },
  {
    id: "prod-3",
    name: "Vino Test",
    slug: "vino-test",
    price: 18.0,
    category: "Vinos",
    imageUrl: null,
  },
];

describe("StoreContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renderiza todos los productos del catálogo", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    expect(screen.getByText("Whisky Test")).toBeInTheDocument();
    expect(screen.getByText("Ron Test")).toBeInTheDocument();
    expect(screen.getByText("Vino Test")).toBeInTheDocument();
  });

  test("muestra la categoría de cada producto", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    expect(screen.getByText("Whisky")).toBeInTheDocument();
    expect(screen.getByText("Ron")).toBeInTheDocument();
    expect(screen.getByText("Vinos")).toBeInTheDocument();
  });

  test("muestra el precio de cada producto formateado", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    expect(screen.getByText("$45.99")).toBeInTheDocument();
    expect(screen.getByText("$32.50")).toBeInTheDocument();
    expect(screen.getByText("$18.00")).toBeInTheDocument();
  });

  test("muestra mensaje de búsqueda cuando hay searchQuery", () => {
    render(<StoreContent products={mockProducts} searchQuery="Whisky" />);

    expect(screen.getByText(/Resultados para:/)).toBeInTheDocument();
    expect(screen.getByText(/3 encontrados/)).toBeInTheDocument();
    expect(screen.getByText("Limpiar búsqueda")).toBeInTheDocument();
  });

  test("muestra mensaje de vacío cuando no hay productos", () => {
    render(<StoreContent products={[]} searchQuery="inexistente" />);

    expect(
      screen.getByText("No se encontraron productos que coincidan con tu búsqueda.")
    ).toBeInTheDocument();
    expect(screen.getByText("Ver todos los productos")).toBeInTheDocument();
  });

  test("muestra botones de 'Agregar' para cada producto", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    const addButtons = screen.getAllByText(/Agregar/);
    expect(addButtons).toHaveLength(3);
  });

  test("al hacer click en 'Agregar' se guarda el producto en localStorage", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    const addButtons = screen.getAllByText(/Agregar/);
    fireEvent.click(addButtons[0]); // Agregar Whisky

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "mi_tienda_carrito",
      expect.stringContaining("Whisky Test")
    );
  });

  test("al agregar un producto se dispara el evento 'cart-updated'", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    const addButtons = screen.getAllByText(/Agregar/);
    fireEvent.click(addButtons[0]);

    expect(dispatchEventSpy).toHaveBeenCalled();
  });

  test("al agregar un producto aparece el sidebar del carrito con 'Tu Carrito'", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    // Antes de agregar, no debería verse el sidebar
    expect(screen.queryByText("🛒 Tu Carrito")).not.toBeInTheDocument();

    // Agregamos un producto
    const addButtons = screen.getAllByText(/Agregar/);
    fireEvent.click(addButtons[0]);

    // Ahora debería aparecer el sidebar
    expect(screen.getByText("🛒 Tu Carrito")).toBeInTheDocument();
  });

  test("agregar el mismo producto dos veces incrementa la cantidad a 2", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    const addButtons = screen.getAllByText(/Agregar/);
    fireEvent.click(addButtons[0]); // Primera vez
    fireEvent.click(addButtons[0]); // Segunda vez

    // Debe mostrar cantidad 2 en el sidebar
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("el enlace 'Ver Carrito Completo & Pagar' apunta a /carrito", () => {
    render(<StoreContent products={mockProducts} searchQuery="" />);

    // Agregar un producto para que aparezca el sidebar
    const addButtons = screen.getAllByText(/Agregar/);
    fireEvent.click(addButtons[0]);

    const checkoutLink = screen.getByText("Ver Carrito Completo & Pagar");
    expect(checkoutLink).toHaveAttribute("href", "/carrito");
  });
});

