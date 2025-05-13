import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import UserWallets from '@/components/crypto/UserWallets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';
import { Redirect } from 'wouter';
import { Loader2Icon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Transaction {
  id: number;
  cryptoType: string;
  transactionHash: string;
  amount: string;
  amountUsd: string | null;
  status: string;
  confirmations: number;
  createdAt: string;
  blockTime: string | null;
}

export default function CryptoDashboard() {
  const { user, isLoading: authLoading } = useUser();
  const [activeTab, setActiveTab] = useState('wallets');
  
  // Fetch transactions
  const { 
    data: transactions, 
    isLoading: txLoading, 
    isError: txError
  } = useQuery({
    queryKey: ['/api/crypto/transactions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/crypto/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    enabled: !!user
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2Icon className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const formatCryptoType = (type: string) => {
    switch (type) {
      case 'bitcoin': return 'Bitcoin (BTC)';
      case 'solana': return 'Solana (SOL)';
      case 'usdt_erc20': return 'USDT (ERC-20)';
      case 'usdt_trc20': return 'USDT (TRC-20)';
      default: return type;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending': return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
          Pending
        </span>
      );
      case 'confirming': return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
          Confirming
        </span>
      );
      case 'confirmed': return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
          Confirmed
        </span>
      );
      case 'failed': return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
          Failed
        </span>
      );
      default: return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          {status}
        </span>
      );
    }
  };

  const getExplorerLink = (cryptoType: string, txHash: string) => {
    switch (cryptoType) {
      case 'bitcoin':
        return `https://www.blockchain.com/btc/tx/${txHash}`;
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}`;
      case 'usdt_erc20':
        return `https://etherscan.io/tx/${txHash}`;
      case 'usdt_trc20':
        return `https://tronscan.org/#/transaction/${txHash}`;
      default:
        return '#';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Cryptocurrency Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your cryptocurrency wallets and view transaction history
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="wallets">My Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallets" className="space-y-6">
          <UserWallets />
        </TabsContent>
        
        <TabsContent value="transactions">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {txLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <Loader2Icon className="w-5 h-5 mx-auto animate-spin" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
                      </td>
                    </tr>
                  ) : txError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <p className="text-sm text-destructive">Failed to load transactions</p>
                      </td>
                    </tr>
                  ) : !transactions?.transactions || transactions.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center">
                        <p className="text-sm text-muted-foreground">No transactions found</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.transactions.map((tx: Transaction) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatCryptoType(tx.cryptoType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div>{tx.amount} {tx.cryptoType === 'bitcoin' ? 'BTC' : tx.cryptoType === 'solana' ? 'SOL' : 'USDT'}</div>
                          {tx.amountUsd && (
                            <div className="text-xs text-muted-foreground">${tx.amountUsd} USD</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {formatStatus(tx.status)}
                          {tx.confirmations > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {tx.confirmations} confirmations
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={getExplorerLink(tx.cryptoType, tx.transactionHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            {tx.transactionHash.substring(0, 8)}...{tx.transactionHash.substring(tx.transactionHash.length - 8)}
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}