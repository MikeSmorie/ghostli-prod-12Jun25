import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2Icon, RefreshCwIcon, ExternalLinkIcon, AlertCircleIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  id: number;
  cryptoType: string;
  walletAddress: string;
  balance: string;
  isActive: boolean;
  lastChecked: string | null;
}

export default function UserWallets() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch user's wallets
  const { 
    data: wallets, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/crypto/wallets'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/crypto/wallets');
      if (!res.ok) {
        throw new Error('Failed to fetch wallets');
      }
      return res.json();
    }
  });
  
  // Generate a new wallet
  const createWalletMutation = useMutation({
    mutationFn: async (cryptoType: string) => {
      const res = await apiRequest('POST', '/api/crypto/wallets/generate', { cryptoType });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate wallet');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Wallet Created',
        description: 'Your new wallet was successfully generated'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crypto/wallets'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Error Creating Wallet',
        description: err.message,
        variant: 'destructive'
      });
    }
  });
  
  // Check balance for all wallets
  const checkBalancesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/crypto/wallets/check-balances');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to check balances');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Balances Updated',
        description: 'Your wallet balances have been refreshed'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crypto/wallets'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Checking Balances',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const handleCreateWallet = (cryptoType: string) => {
    createWalletMutation.mutate(cryptoType);
  };
  
  const handleCheckBalances = () => {
    checkBalancesMutation.mutate();
  };
  
  const formatCryptoType = (type: string) => {
    switch (type) {
      case 'bitcoin':
        return 'Bitcoin (BTC)';
      case 'solana':
        return 'Solana (SOL)';
      case 'usdt_erc20':
        return 'USDT (ERC-20)';
      case 'usdt_trc20':
        return 'USDT (TRC-20)';
      default:
        return type;
    }
  };
  
  const getExplorerUrl = (wallet: Wallet) => {
    switch (wallet.cryptoType) {
      case 'bitcoin':
        return `https://www.blockchain.com/btc/address/${wallet.walletAddress}`;
      case 'solana':
        return `https://solscan.io/account/${wallet.walletAddress}`;
      case 'usdt_erc20':
        return `https://etherscan.io/address/${wallet.walletAddress}`;
      case 'usdt_trc20':
        return `https://tronscan.org/#/address/${wallet.walletAddress}`;
      default:
        return '#';
    }
  };
  
  const filteredWallets = () => {
    if (!wallets?.wallets || wallets.wallets.length === 0) {
      return [];
    }
    
    if (activeTab === 'all') {
      return wallets.wallets;
    }
    
    return wallets.wallets.filter((wallet: Wallet) => wallet.cryptoType === activeTab);
  };
  
  const getSupportedTypes = () => {
    return [
      { value: 'bitcoin', label: 'Bitcoin' },
      { value: 'solana', label: 'Solana' },
      { value: 'usdt_erc20', label: 'USDT (ERC-20)' },
      { value: 'usdt_trc20', label: 'USDT (TRC-20)' }
    ];
  };
  
  const renderWalletCards = () => {
    const filtered = filteredWallets();
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-10">
          <AlertCircleIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No wallets found</h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'all' 
              ? "You don't have any cryptocurrency wallets yet" 
              : `You don't have a ${formatCryptoType(activeTab)} wallet yet`}
          </p>
          {activeTab !== 'all' && (
            <Button onClick={() => handleCreateWallet(activeTab)}>
              Create {formatCryptoType(activeTab)} Wallet
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((wallet: Wallet) => (
          <Card key={wallet.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{formatCryptoType(wallet.cryptoType)}</CardTitle>
                <Badge variant={wallet.isActive ? "secondary" : "outline"}>
                  {wallet.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="truncate text-xs font-mono">
                {wallet.walletAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Balance</p>
                  <p className="text-2xl font-bold">
                    {wallet.balance || '0'} 
                    {wallet.cryptoType === 'bitcoin' 
                      ? 'BTC' 
                      : wallet.cryptoType === 'solana' 
                        ? 'SOL' 
                        : 'USDT'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last updated</p>
                  <p className="text-sm">
                    {wallet.lastChecked 
                      ? new Date(wallet.lastChecked).toLocaleString() 
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex w-full justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(wallet.walletAddress);
                    toast({
                      title: 'Address Copied',
                      description: 'Wallet address copied to clipboard'
                    });
                  }}
                >
                  Copy Address
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(wallet), '_blank')}
                >
                  <ExternalLinkIcon className="h-4 w-4 mr-1" />
                  View Explorer
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading wallets...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-center py-10">
        <AlertCircleIcon className="h-10 w-10 mx-auto text-destructive mb-2" />
        <h3 className="text-lg font-medium">Error loading wallets</h3>
        <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Crypto Wallets</h2>
          <p className="text-muted-foreground">Manage your cryptocurrency wallets and view balances</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={handleCheckBalances}
            disabled={checkBalancesMutation.isPending}
          >
            {checkBalancesMutation.isPending ? (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Refresh Balances
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Wallets</TabsTrigger>
          <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
          <TabsTrigger value="solana">Solana</TabsTrigger>
          <TabsTrigger value="usdt_erc20">USDT (ERC-20)</TabsTrigger>
          <TabsTrigger value="usdt_trc20">USDT (TRC-20)</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {renderWalletCards()}
        </div>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Wallet</CardTitle>
          <CardDescription>
            Generate a new cryptocurrency wallet for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {getSupportedTypes().map((type) => {
              const hasWallet = wallets?.wallets?.some((w: Wallet) => w.cryptoType === type.value);
              
              return (
                <Button
                  key={type.value}
                  variant={hasWallet ? "outline" : "default"}
                  onClick={() => handleCreateWallet(type.value)}
                  disabled={createWalletMutation.isPending || hasWallet}
                  className="h-auto py-3"
                >
                  {createWalletMutation.isPending && createWalletMutation.variables === type.value ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : hasWallet ? (
                    <>{type.label} Wallet Created</>
                  ) : (
                    <>Generate {type.label} Wallet</>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}