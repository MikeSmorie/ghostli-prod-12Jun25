import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CopyIcon, CheckIcon, ArrowUpRightIcon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface CryptoWalletDisplayProps {
  walletAddress: string;
  cryptoType: string;
  amount: string;
  amountUsd: string;
  referenceId: string;
  expiresAt: Date;
  onVerify: () => void;
  onRefresh: () => void;
  isVerifying: boolean;
}

export default function CryptoWalletDisplay({
  walletAddress,
  cryptoType,
  amount,
  amountUsd,
  referenceId,
  expiresAt,
  onVerify,
  onRefresh,
  isVerifying = false
}: CryptoWalletDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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

  const formatExpiryTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast({
      title: 'Address copied',
      description: 'The wallet address has been copied to your clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    let url = '';
    
    switch (cryptoType) {
      case 'bitcoin':
        url = `https://www.blockchain.com/btc/address/${walletAddress}`;
        break;
      case 'solana':
        url = `https://solscan.io/account/${walletAddress}`;
        break;
      case 'usdt_erc20':
        url = `https://etherscan.io/address/${walletAddress}`;
        break;
      case 'usdt_trc20':
        url = `https://tronscan.org/#/address/${walletAddress}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
  };

  const getPaymentInstructions = () => {
    switch (cryptoType) {
      case 'bitcoin':
        return 'Send the exact amount of Bitcoin to the address below. The transaction may take 10-30 minutes to confirm.';
      case 'solana':
        return 'Send the exact amount of Solana to the address below. The transaction should confirm within a minute.';
      case 'usdt_erc20':
        return 'Send the exact amount of USDT (ERC-20) to the address below. Note that you will need ETH for gas fees.';
      case 'usdt_trc20':
        return 'Send the exact amount of USDT (TRC-20) to the address below. Transactions typically confirm within a minute.';
      default:
        return 'Send the exact amount to the address below.';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pay with {formatCryptoType(cryptoType)}</CardTitle>
        <CardDescription>
          {getPaymentInstructions()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
          <QRCodeSVG 
            value={walletAddress} 
            size={200} 
            includeMargin={true}
          />
          <p className="text-xs text-center mt-2 text-muted-foreground">
            Scan this QR code with your wallet
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="wallet-address">Wallet Address</Label>
          <div className="flex">
            <div className="flex-1 p-2 bg-muted rounded-l-md text-xs sm:text-sm font-mono truncate">
              {walletAddress}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-l-none"
              onClick={copyToClipboard}
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Payment Amount</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted rounded-md">
              <div className="text-lg font-semibold">{amount}</div>
              <div className="text-xs text-muted-foreground">{formatCryptoType(cryptoType)}</div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <div className="text-lg font-semibold">${amountUsd}</div>
              <div className="text-xs text-muted-foreground">USD Equivalent</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground">Reference: </span>
            <span className="font-mono">{referenceId.slice(0, 8)}...</span>
          </div>
          <div>
            <span className="text-muted-foreground">Expires in: </span>
            <span className={expiresAt.getTime() < Date.now() ? 'text-destructive' : ''}>
              {formatExpiryTime(expiresAt)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          className="w-full" 
          onClick={onVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Verifying Transaction...
            </>
          ) : (
            <>Verify Payment</>
          )}
        </Button>
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={openExplorer}>
            <ArrowUpRightIcon className="mr-2 h-4 w-4" />
            View in Explorer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}