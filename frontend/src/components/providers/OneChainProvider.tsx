'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@onelabs/dapp-kit';
import { useState } from 'react';
import { ONECHAIN_RPC } from '@/lib/constants';

// Import OneChain dapp-kit styles
import '@onelabs/dapp-kit/dist/index.css';

export function OneChainProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60 * 5, retry: 1 },
        },
      })
  );

  const networks = {
    testnet: { url: ONECHAIN_RPC },
    mainnet: { url: 'https://rpc-mainnet.onelabs.cc:443' },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
