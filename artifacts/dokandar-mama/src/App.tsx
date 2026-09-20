import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { ClerkProvider, Show, useClerk, useAuth } from '@clerk/react';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';

import { Layout } from '@/components/layout';
import { ShopOnboardingGate } from '@/components/shop-onboarding-gate';
import { ShopThemeProvider } from '@/context/shop-theme-context';
import { LanguageProvider } from '@/context/language-context';
import { ChouPresenceProvider } from '@/context/chou-presence-context';
import { RoleGuard } from '@/components/role-guard';
import { Dashboard } from '@/pages/dashboard';
import { SuperAdminDashboard } from '@/pages/dashboard/super-admin-dashboard';
import { Billing } from '@/pages/billing';
import { Inventory } from '@/pages/inventory';
import { Customers } from '@/pages/customers';
import { Reports } from '@/pages/reports';
import { Receipt } from '@/pages/receipt';
import { Cashbox } from '@/pages/cashbox';
import { Landing } from '@/pages/landing';
import { SignInPage } from '@/pages/sign-in';
import { SignUpPage } from '@/pages/sign-up';
import { ManagementPage } from '@/pages/management';
import { SubscriptionsPage } from '@/pages/subscriptions';

const queryClient = new QueryClient();

// A voice command can navigate to any authenticated screen.  Do not let an
// unexpected render failure on one of those screens leave the user staring at
// an empty browser tab; show a recoverable, human-readable screen instead.
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dokandar Mama render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md w-full bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
            <h1 className="text-lg font-bold text-foreground mb-2">পেজটি খুলতে সমস্যা হয়েছে</h1>
            <p className="text-sm text-muted-foreground mb-5">
              আপনার কোনো হিসাব বা তথ্য হারায়নি। আবার চেষ্টা করতে নিচের বাটনে চাপ দিন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Resolves key from build-time Vite env OR runtime window injection OR hostname
const rawClerkKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  (typeof window !== 'undefined' && (window as any).__CLERK_PUBLISHABLE_KEY__) ||
  '';
let clerkPubKey = rawClerkKey;
if (rawClerkKey) {
  try {
    const hostname = typeof window !== 'undefined' ? window.location?.hostname : '';
    const isLocal = !hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
    const isNative = typeof window !== 'undefined' && Boolean((window as any).Capacitor?.isNativePlatform?.());
    const hostKey = (!isLocal && !isNative) ? publishableKeyFromHost(hostname, rawClerkKey) : null;
    clerkPubKey = hostKey || rawClerkKey;
  } catch {
    clerkPubKey = rawClerkKey;
  }
}

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly), auto-set
// in prod. Do NOT gate on import.meta.env.PROD / NODE_ENV — the empty dev value
// is intentional, and any branching breaks the prod proxy.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function MissingClerkConfigScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md w-full bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Clerk Configuration Required</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The application requires Clerk API keys to run. Please add the following environment variables in your Render Dashboard:
        </p>
        <div className="bg-muted p-3 rounded-lg text-left text-xs font-mono mb-4 space-y-1 text-foreground">
          <div><strong>CLERK_PUBLISHABLE_KEY</strong>=pk_test_...</div>
          <div><strong>CLERK_SECRET_KEY</strong>=sk_test_...</div>
          <div><strong>VITE_CLERK_PUBLISHABLE_KEY</strong>=pk_test_...</div>
        </div>
        <p className="text-xs text-muted-foreground">
          After saving these variables in your Render Dashboard (Environment tab), trigger <strong>Clear build cache & deploy</strong>.
        </p>
      </div>
    </div>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(15, 85%, 55%)',
    colorForeground: 'hsl(20, 40%, 15%)',
    colorMutedForeground: 'hsl(20, 20%, 40%)',
    colorDanger: 'hsl(0, 70%, 50%)',
    colorBackground: 'hsl(0, 0%, 100%)',
    colorInput: 'hsl(35, 15%, 96%)',
    colorInputForeground: 'hsl(20, 40%, 15%)',
    colorNeutral: 'hsl(20, 20%, 85%)',
    fontFamily: "'Hind Siliguri', sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-xl font-bold text-[hsl(20,40%,15%)]',
    headerSubtitle: 'text-[hsl(20,20%,40%)]',
    socialButtonsBlockButtonText: 'text-[hsl(20,40%,15%)] font-medium',
    formFieldLabel: 'text-[hsl(20,40%,15%)] font-medium',
    footerActionLink: 'text-[hsl(15,85%,55%)] font-semibold hover:text-[hsl(15,85%,45%)]',
    footerActionText: 'text-[hsl(20,20%,40%)]',
    dividerText: 'text-[hsl(20,20%,40%)]',
    identityPreviewEditButton: 'text-[hsl(15,85%,55%)]',
    formFieldSuccessText: 'text-[hsl(150,60%,30%)]',
    alertText: 'text-[hsl(0,70%,50%)]',
    logoBox: 'flex justify-center py-2',
    logoImage: 'h-12 w-12',
    socialButtonsBlockButton: 'border border-[hsl(20,20%,85%)] rounded-xl hover:bg-[hsl(35,15%,96%)]',
    formButtonPrimary: 'bg-[hsl(15,85%,55%)] hover:bg-[hsl(15,85%,45%)] rounded-xl text-white font-semibold',
    formFieldInput: 'border border-[hsl(20,20%,85%)] rounded-xl bg-[hsl(35,15%,96%)] text-[hsl(20,40%,15%)]',
    footerAction: 'text-center',
    dividerLine: 'bg-[hsl(20,20%,85%)]',
    alert: 'bg-[hsl(0,70%,97%)] border border-[hsl(0,70%,85%)] rounded-xl',
    otpCodeFieldInput: 'border border-[hsl(20,20%,85%)] rounded-xl',
    formFieldRow: 'mb-2',
    main: 'px-8 py-6',
  },
};

function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
        <img src={`${basePath}/logo.svg`} alt="দোকানদার মামা" className="h-7 w-7" />
      </div>
      <div className="text-base font-bold text-foreground mb-1">দোকানদার মামা লোড হচ্ছে...</div>
      <p className="text-xs text-muted-foreground">অনুগ্রহ করে অপেক্ষা করুন</p>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    return <Redirect to="/app" />;
  }

  return <Landing />;
}

// Every authenticated screen goes through here, which is what guarantees
// the Layout's home/billing nav (bottom bar on mobile, sidebar on desktop)
// is present on every page.
function AuthedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  return (
    <ShopOnboardingGate>
      <Layout>{children}</Layout>
    </ShopOnboardingGate>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/index.html" component={HomeRedirect} />

      {/* REQUIRED — copy "/sign-in/*?" and "/sign-up/*?" verbatim. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* Platform Super Admin dashboard — accessed at /admin */}
      <Route path="/admin">
        <AuthedRoute>
          <RoleGuard allowedRoles={["superadmin"]} fallbackTitle="সুপার অ্যাডমিন অ্যাক্সেস সংরক্ষিত">
            <SuperAdminDashboard />
          </RoleGuard>
        </AuthedRoute>
      </Route>

      <Route path="/app/sales/:id">
        <AuthedRoute>
          <Receipt />
        </AuthedRoute>
      </Route>
      <Route path="/app/billing">
        <AuthedRoute>
          <Billing />
        </AuthedRoute>
      </Route>
      <Route path="/app/inventory">
        <AuthedRoute>
          <Inventory />
        </AuthedRoute>
      </Route>
      <Route path="/app/customers">
        <AuthedRoute>
          <Customers />
        </AuthedRoute>
      </Route>
      <Route path="/app/cashbox">
        <AuthedRoute>
          <Cashbox />
        </AuthedRoute>
      </Route>
      <Route path="/app/reports">
        <Redirect to="/app/management?tab=reports" />
      </Route>
      <Route path="/app/subscriptions">
        <Redirect to="/app/management?tab=subscription" />
      </Route>
      <Route path="/app/management">
        <AuthedRoute>
          <RoleGuard minRole="owner" fallbackTitle="মালিক ব্যবস্থাপনা প্যানেল সংরক্ষিত">
            <ManagementPage />
          </RoleGuard>
        </AuthedRoute>
      </Route>
      <Route path="/app">
        <AuthedRoute>
          <Dashboard />
        </AuthedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// Helps the webview stay up-to-date when the signed-in user changes by invalidating the QueryClient cache.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkAuthTokenWiring() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'স্বাগতম',
            subtitle: 'আপনার দোকানের হিসাবে লগ ইন করুন',
          },
        },
        signUp: {
          start: {
            title: 'অ্যাকাউন্ট তৈরি করুন',
            subtitle: 'আজই আপনার দোকানের হিসাব শুরু করুন',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <ClerkAuthTokenWiring />
      <ShopThemeProvider>
        <LanguageProvider>
          <ChouPresenceProvider>
            <Router />
          </ChouPresenceProvider>
        </LanguageProvider>
      </ShopThemeProvider>
    </ClerkProvider>
  );
}

function AppContent() {
  if (!clerkPubKey) {
    return <MissingClerkConfigScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

export default App;
