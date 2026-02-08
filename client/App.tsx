import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { JackpotProvider } from "@/contexts/JackpotContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Leaderboard from "./pages/Leaderboard";
import Referrals from "./pages/Referrals";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import WalletPage from "./pages/Wallet";
import SettingsPage from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import AdminPackages from "./pages/AdminPackages";
import AIEmployeePage from "./pages/AIEmployeePage";
import EnhancedSlotsPage from "./pages/EnhancedSlotsPage";
import FreeSlotsDocs from "./pages/FreeSlotsDocs";
import BingoPage from "./pages/BingoPage";
import SportsbookPage from "./pages/SportsbookPage";
import TableGamesPage from "./pages/TableGamesPage";
import PokerPage from "./pages/PokerPage";
import MiniGamesPage from "./pages/MiniGamesPage";
import AccountSettings from "./pages/AccountSettings";
import KYC from "./pages/KYC";
import Withdraw from "./pages/Withdraw";
import Store from "./pages/Store";
import WalletEnhanced from "./pages/WalletEnhanced";
import Tournaments from "./pages/Tournaments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <JackpotProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route
                        path="/dashboard"
                        element={
                          <AuthGuard>
                            <Dashboard />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games"
                        element={
                          <AuthGuard>
                            <Games />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/slots"
                        element={
                          <AuthGuard>
                            <EnhancedSlotsPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/slots/docs"
                        element={<FreeSlotsDocs />}
                      />
                      <Route
                        path="/games/bingo"
                        element={
                          <AuthGuard>
                            <BingoPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/sportsbook"
                        element={
                          <AuthGuard>
                            <SportsbookPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/table"
                        element={
                          <AuthGuard>
                            <TableGamesPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/poker"
                        element={
                          <AuthGuard>
                            <PokerPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/games/mini"
                        element={
                          <AuthGuard>
                            <MiniGamesPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/tournaments"
                        element={
                          <AuthGuard>
                            <Tournaments />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/account/settings"
                        element={
                          <AuthGuard>
                            <AccountSettings />
                          </AuthGuard>
                        }
                      />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/referrals" element={<Referrals />} />
                      <Route path="/help" element={<Help />} />
                      <Route
                        path="/profile"
                        element={
                          <AuthGuard>
                            <Profile />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/wallet"
                        element={
                          <AuthGuard>
                            <WalletPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/wallet/enhanced"
                        element={
                          <AuthGuard>
                            <WalletEnhanced />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <AuthGuard>
                            <SettingsPage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <AuthGuard requireAdmin={true}>
                            <AdminPanel />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/admin/packages"
                        element={
                          <AuthGuard requireAdmin={true}>
                            <AdminPackages />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/admin/ai-employees"
                        element={
                          <AuthGuard requireAdmin={true}>
                            <AIEmployeePage />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/admin/*"
                        element={
                          <AuthGuard requireAdmin={true}>
                            <AdminPanel />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/kyc"
                        element={
                          <AuthGuard>
                            <KYC />
                          </AuthGuard>
                        }
                      />
                      <Route
                        path="/withdraw"
                        element={
                          <AuthGuard>
                            <Withdraw />
                          </AuthGuard>
                        }
                      />
                      <Route path="/store" element={<Store />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </TooltipProvider>
            </JackpotProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
