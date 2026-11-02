/**
 * Tests de componente: ProductDetailClient
 *
 * Verifica que el detalle del producto muestre toda la información
 * relevante y que la funcionalidad del carrito funcione correctamente.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProductDetailClient from "@/components/ProductDetailClient";

// Mock de next/link
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

jest.spyOn(window, "dispatchEvent").mockImplementation(() => true);

const mockProduct = {
  id: "prod-1",
  name: "Johnnie Walker Black Label",
  slug: "johnnie-walker-black-label",
  price: 45.99,
  category: "Whisky",
  abv: 40,
  volume: "750 ml",
  stock: 15,
  description: "Un whisky escocés premium de mezcla.",
  imageUrl: "https://example.com/jw.jpg",
  isFeatured: true,
};

describe("ProductDetailClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test("renderiza el nombre del producto", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("Johnnie Walker Black Label")).toBeInTheDocument();
  });

  test("muestra la categoría del producto", () => {
    render(<ProductDetailClient product={mockProduct} />);
    // La categoría aparece en el badge y en las specs
    const categoryElements = screen.getAllByText("Whisky");
    expect(categoryElements.length).toBeGreaterThanOrEqual(1);
  });

  test("muestra el porcentaje de alcohol (ABV)", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("40% ABV")).toBeInTheDocument();
    expect(screen.getByText("40% Alc. Vol.")).toBeInTheDocument();
  });

  test("muestra el volumen del producto", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("750 ml")).toBeInTheDocument();
  });

  test("muestra el stock disponible", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("15 unidades")).toBeInTheDocument();
  });

  test("muestra la descripción del producto", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("Un whisky escocés premium de mezcla.")).toBeInTheDocument();
  });

  test("muestra el precio formateado", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("$45.99")).toBeInTheDocument();
  });

  test("muestra el badge 'Premium' cuando isFeatured es true", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  test("NO muestra el badge 'Premium' cuando isFeatured es false", () => {
    const regularProduct = { ...mockProduct, isFeatured: false };
    render(<ProductDetailClient product={regularProduct} />);
    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
  });

  test("muestra 'Sin descripción disponible.' cuando no hay descripción", () => {
    const noDescProduct = { ...mockProduct, description: null };
    render(<ProductDetailClient product={noDescProduct} />);
    expect(screen.getByText("Sin descripción disponible.")).toBeInTheDocument();
  });

  test("tiene un botón 'Añadir al Carrito'", () => {
    render(<ProductDetailClient product={mockProduct} />);
    expect(screen.getByText(/Añadir al Carrito/)).toBeInTheDocument();
  });

  test("al hacer click en 'Añadir al Carrito' se guarda en localStorage", () => {
    render(<ProductDetailClient product={mockProduct} />);

    fireEvent.click(screen.getByText(/Añadir al Carrito/));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "mi_tienda_carrito",
      expect.stringContaining("Johnnie Walker Black Label")
    );
  });

  test("al añadir al carrito aparece el sidebar con el producto", () => {
    render(<ProductDetailClient product={mockProduct} />);

    expect(screen.queryByText("🛒 Tu Carrito")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Añadir al Carrito/));

    expect(screen.getByText("🛒 Tu Carrito")).toBeInTheDocument();
  });
});

