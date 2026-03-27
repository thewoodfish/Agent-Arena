'use client';

import { useCallback } from 'react';
import {
  useConnectWallet,
  useDisconnectWallet,
  useCurrentAccount,
  useWallets,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@onelabs/dapp-kit';
import { Transaction } from '@onelabs/sui/transactions';
import { useGameStore } from '@/store/gameStore';
import type { AgentConfig } from '@/lib/types';
import { PACKAGE_ID, STAKE_AMOUNT, OCT_COIN_TYPE, ONECHAIN_FAUCET } from '@/lib/constants';

// ─── OneWallet (real) ──────────────────────────────────────────────────────

export function useOneWallet() {
  const wallets = useWallets();
  const { mutate: connect, isPending: isConnecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { setWallet } = useGameStore();

  const oneWallet = wallets[0]; // Use first available wallet (OneWallet extension)

  const connectWallet = useCallback(async () => {
    if (!oneWallet) throw new Error('OneWallet not found — install the OneChain extension');
    return new Promise<void>((resolve, reject) => {
      connect(
        { wallet: oneWallet },
        {
          onSuccess: () => {
            if (account?.address) setWallet(account.address, true);
            resolve();
          },
          onError: reject,
        }
      );
    });
  }, [oneWallet, connect, account, setWallet]);

  const disconnectWallet = useCallback(() => {
    disconnect(undefined, { onSuccess: () => setWallet(null, false) });
  }, [disconnect, setWallet]);

  const createAgent = useCallback(
    async (config: AgentConfig) => {
      if (!account) throw new Error('Wallet not connected');
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::agent::create_agent`,
        arguments: [
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(config.name))),
          tx.pure.u8(config.strategy === 'attacker' ? 0 : config.strategy === 'defender' ? 1 : 2),
          tx.pure.u8(config.aggression),
          tx.pure.u8(config.riskTolerance),
          tx.pure.u8(config.defenseWeight),
          tx.pure.u8(config.adaptability),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      return { txHash: result.digest, agentId: result.digest };
    },
    [account, signAndExecute]
  );

  const createMatch = useCallback(
    async (agentObjectId: string, stakeAmount: number) => {
      if (!account) throw new Error('Wallet not connected');
      const coins = await client.getCoins({ owner: account.address, coinType: OCT_COIN_TYPE });
      if (!coins.data.length) throw new Error('No OCT balance');

      const tx = new Transaction();
      const [stakeCoins] = tx.splitCoins(tx.object(coins.data[0].coinObjectId), [stakeAmount]);
      tx.moveCall({
        target: `${PACKAGE_ID}::arena::create_match`,
        arguments: [tx.object(agentObjectId), stakeCoins],
      });
      const result = await signAndExecute({ transaction: tx });
      return { txHash: result.digest, matchId: result.digest };
    },
    [account, client, signAndExecute]
  );

  const joinMatch = useCallback(
    async (matchObjectId: string, agentObjectId: string) => {
      if (!account) throw new Error('Wallet not connected');
      const coins = await client.getCoins({ owner: account.address, coinType: OCT_COIN_TYPE });
      if (!coins.data.length) throw new Error('No OCT balance');

      const tx = new Transaction();
      const [stakeCoins] = tx.splitCoins(tx.object(coins.data[0].coinObjectId), [STAKE_AMOUNT]);
      tx.moveCall({
        target: `${PACKAGE_ID}::arena::join_match`,
        arguments: [tx.object(matchObjectId), tx.object(agentObjectId), stakeCoins],
      });
      const result = await signAndExecute({ transaction: tx });
      return { txHash: result.digest };
    },
    [account, client, signAndExecute]
  );

  const getBalance = useCallback(async (): Promise<number> => {
    if (!account) return 0;
    try {
      const bal = await client.getBalance({ owner: account.address, coinType: OCT_COIN_TYPE });
      return Number(bal.totalBalance) / 1_000_000_000;
    } catch {
      return 0;
    }
  }, [account, client]);

  const requestFaucet = useCallback(async () => {
    if (!account) return;
    await fetch(ONECHAIN_FAUCET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: account.address } }),
    });
  }, [account]);

  return {
    account,
    address: account?.address ?? null,
    isConnected: !!account,
    isConnecting,
    connectWallet,
    disconnectWallet,
    createAgent,
    createMatch,
    joinMatch,
    getBalance,
    requestFaucet,
  };
}

// ─── Mock wallet (demo mode) ────────────────────────────────────────────────

function generateFakeTxHash(): string {
  return Array.from({ length: 44 }, () =>
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
      Math.floor(Math.random() * 62)
    ]
  ).join('');
}

export function useMockWallet() {
  const { setWallet } = useGameStore();

  const connectWallet = useCallback(async () => {
    console.log('DEMO MODE — no real transactions');
    const addr = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    setWallet(addr, true);
  }, [setWallet]);

  const disconnectWallet = useCallback(() => setWallet(null, false), [setWallet]);

  const createAgent = useCallback(async (_: AgentConfig) => {
    await new Promise((r) => setTimeout(r, 800));
    return { txHash: generateFakeTxHash(), agentId: generateFakeTxHash() };
  }, []);

  const createMatch = useCallback(async (_agentId: string, _stake: number) => {
    await new Promise((r) => setTimeout(r, 800));
    return { txHash: generateFakeTxHash(), matchId: generateFakeTxHash() };
  }, []);

  const joinMatch = useCallback(async (_matchId: string, _agentId: string) => {
    await new Promise((r) => setTimeout(r, 600));
    return { txHash: generateFakeTxHash() };
  }, []);

  const getBalance = useCallback(async () => 500, []);
  const requestFaucet = useCallback(async () => {}, []);

  return {
    account: null,
    address: null,
    isConnected: false,
    isConnecting: false,
    connectWallet,
    disconnectWallet,
    createAgent,
    createMatch,
    joinMatch,
    getBalance,
    requestFaucet,
  };
}

// ─── Auto-detect hook ───────────────────────────────────────────────────────

export function useWalletActions() {
  const demoMode = useGameStore((s) => s.demoMode);
  const real = useOneWallet();
  const mock = useMockWallet();
  return demoMode ? mock : real;
}
