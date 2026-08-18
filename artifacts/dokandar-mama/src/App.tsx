import { useEffect, useRef } from 'react';
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
import { Dashboard } from '@/pages/dashboard';
import { Billing } from '@/pages/billing';
import { Inventory } from '@/pages/inventory';
import { Customers } from '@/pages/customers';
import { Reports } from '@/pages/reports';
import { Receipt } from '@/pages/receipt';
import { Cashbox } from '@/pages/cashbox';
import { Landing } from '@/pages/landing';
import { SignInPage } from '@/pages/sign-in';
import { SignUpPage } from '@/pages/sign-up';

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains. Do not inline the env var, leave
// publishableKey undefined, or replace publishableKeyFromHost with anything else.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

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

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
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

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

// Every authenticated screen goes through here, which is what guarantees
// the Layout's home/billing nav (bottom bar on mobile, sidebar on desktop)
// is present on every page — previously only "/app" was wrapped in Layout,
// so Billing/Inventory/Customers/Reports/Receipt rendered with no nav at
// all and back-button was the only way around.
function AuthedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <ShopOnboardingGate>
          <Layout>{children}</Layout>
        </ShopOnboardingGate>
      </Show>

      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />

      {/* REQUIRED — copy "/sign-in/*?" and "/sign-up/*?" verbatim. */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

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
        <AuthedRoute>
          <Reports />
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
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ClerkAuthTokenWiring />
        <Router />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
