import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext";
import Navbar from "./components/navbar";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import CartPage from "./pages/CartPage";
import CategoryPage from "./pages/CategoryPage";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";

function AppLayout() {
  const { cartCount, addToCart } = useCart();

  return (
    <>
      <Navbar cartCount={cartCount} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<CategoryPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route
          path="/products/:id"
          element={<ProductPage addToCart={addToCart} />}
        />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="*" element={<p className="p-8">Page not found.</p>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </CartProvider>
  );
}
