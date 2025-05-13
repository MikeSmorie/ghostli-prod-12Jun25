import React, { useState } from 'react';
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define wallet type
interface Wallet {
  id: number;
  cryptoType: string;
  walletAddress: string;
  balance: string;
  isActive: boolean;
  lastChecked: string | null;
}

const CryptoIcon: React.FC<{ type: string }> = ({ type }) => {
  // This function can be expanded with actual crypto SVG icons
  const defaultStyle = "w-5 h-5 mr-2";
  
  switch (type) {
    case 'bitcoin':
      return <span className={`${defaultStyle} text-orange-500`}>₿</span>;
    case 'solana':
      return <span className={`${defaultStyle} text-purple-500`}>◎</span>;
    case 'usdt_erc20':
      return <span className={`${defaultStyle} text-green-500`}>₮E</span>;
    case 'usdt_trc20':
      return <span className={`${defaultStyle} text-green-500`}>₮T</span>;
    default:
      return <span className={defaultStyle}>?</span>;
  }
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

export default function UserWallets() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch wallets for the authenticated user
  const { 
    data: wallets, 
    isLoading, 
    isError, 
    error,
    refetch 
  }: UseQueryResult<{ wallets: Wallet[] }, Error> = useQuery({
    queryKey: ['/api/crypto/wallets'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/crypto/wallets');
      return res.json();
    }
  });
  
  // Setup wallets mutation
  const setupWalletsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/crypto/wallets/setup');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Wallets setup successful',
        description: 'Your cryptocurrency wallets have been created successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crypto/wallets'] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Wallet setup failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  });

  // Filter wallets based on the active tab
  const filteredWallets = wallets?.wallets?.filter(wallet => {
    if (activeTab === 'all') return true;
    return wallet.cryptoType === activeTab;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2Icon className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading wallets...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-6 bg-destructive/10 rounded-lg">
        <p className="font-semibold text-destructive">Error loading wallets</p>
        <p className="text-sm mt-2">{error?.message || 'An unknown error occurred'}</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm" 
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!wallets?.wallets || wallets.wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crypto Wallets</CardTitle>
          <CardDescription>
            You don't have any cryptocurrency wallets set up yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setupWalletsMutation.mutate()} 
            disabled={setupWalletsMutation.isPending}
          >
            {setupWalletsMutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Setting up wallets...
              </>
            ) : (
              'Setup Wallets'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Crypto Wallets</CardTitle>
          <CardDescription>
            View and manage your cryptocurrency wallets
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bitcoin">Bitcoin</TabsTrigger>
            <TabsTrigger value="solana">Solana</TabsTrigger>
            <TabsTrigger value="usdt_erc20">USDT (ERC-20)</TabsTrigger>
            <TabsTrigger value="usdt_trc20">USDT (TRC-20)</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3">
              {filteredWallets.map(wallet => (
                <div 
                  key={wallet.id} 
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CryptoIcon type={wallet.cryptoType} />
                      <span className="font-medium">{formatCryptoType(wallet.cryptoType)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        Balance: {parseFloat(wallet.balance || '0').toFixed(8)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground flex justify-between items-center">
                      <span className="font-mono truncate text-xs md:text-sm">
                        {wallet.walletAddress}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.walletAddress);
                          toast({
                            title: 'Address copied',
                            description: 'Wallet address copied to clipboard'
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {wallet.lastChecked ? (
                      <span>Last updated: {new Date(wallet.lastChecked).toLocaleString()}</span>
                    ) : (
                      <span>Not checked yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}