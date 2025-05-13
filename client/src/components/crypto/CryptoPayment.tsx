import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2Icon, AlertCircleIcon, CheckCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CryptoWalletDisplay from './CryptoWalletDisplay';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CryptoPaymentProps {
  planId: number;
  planName: string;
  planPrice: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CryptoPayment({
  planId,
  planName,
  planPrice,
  onSuccess,
  onCancel
}: CryptoPaymentProps) {
  const { toast } = useToast();
  const [selectedCryptoType, setSelectedCryptoType] = useState('bitcoin');
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<null | {
    success: boolean;
    message: string;
    confirmed?: boolean;
  }>(null);
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  
  // Create payment request
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/crypto/payment/request', {
        planId,
        cryptoType: selectedCryptoType
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create payment request');
      }
      
      return res.json();
    },
    onSuccess: () => {
      setPaymentCreated(true);
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Request Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Fetch the payment info after creation
  const {
    data: paymentInfo,
    isLoading: isLoadingPayment,
    refetch: refetchPayment
  } = useQuery({
    queryKey: ['/api/crypto/payment/info', selectedCryptoType, planId],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/crypto/payment/pending');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch payment information');
      }
      
      const data = await res.json();
      
      if (!data.hasPendingPayment) {
        throw new Error('No pending payment found');
      }
      
      // Fetch the wallet details
      const walletRes = await apiRequest('GET', `/api/crypto/wallets/type/${selectedCryptoType}`);
      if (!walletRes.ok) {
        throw new Error('Failed to fetch wallet information');
      }
      
      const walletData = await walletRes.json();
      
      return {
        ...data,
        wallet: walletData.wallet
      };
    },
    enabled: paymentCreated,
    refetchInterval: paymentCreated ? 30000 : false, // Refetch every 30 seconds if payment is created
    retry: 3
  });
  
  // Verify payment
  const verifyPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!transactionHash.trim()) {
        throw new Error('Please enter a transaction hash');
      }
      
      const res = await apiRequest('POST', '/api/crypto/payment/verify', {
        transactionHash: transactionHash.trim(),
        cryptoType: selectedCryptoType,
        walletId: paymentInfo?.wallet?.id
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      setVerificationResult({
        success: true,
        message: data.message,
        confirmed: data.verified
      });
      
      if (data.verified) {
        setShowVerificationSuccess(true);
        // Invalidate subscription queries to refresh user's subscription status
        queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      }
    },
    onError: (error: Error) => {
      setVerificationResult({
        success: false,
        message: error.message
      });
    }
  });
  
  const handleVerifyPayment = () => {
    verifyPaymentMutation.mutate();
  };
  
  const handleCreatePayment = () => {
    createPaymentMutation.mutate();
  };
  
  const handleSuccessClose = () => {
    setShowVerificationSuccess(false);
    if (onSuccess) onSuccess();
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pay with Cryptocurrency</CardTitle>
          <CardDescription>
            Subscribe to {planName} plan (${planPrice} USD) using cryptocurrency
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!paymentCreated ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crypto-type">Select Cryptocurrency</Label>
                <Select 
                  value={selectedCryptoType}
                  onValueChange={setSelectedCryptoType}
                >
                  <SelectTrigger id="crypto-type">
                    <SelectValue placeholder="Select cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="solana">Solana (SOL)</SelectItem>
                    <SelectItem value="usdt_erc20">USDT (ERC-20)</SelectItem>
                    <SelectItem value="usdt_trc20">USDT (TRC-20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Important Notes:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Send the exact amount shown to complete your payment.</li>
                  <li>Transaction times vary by network (BTC: 10-60 min, SOL/USDT: 1-5 min).</li>
                  <li>After sending, enter your transaction hash for verification.</li>
                  <li>Payment addresses are secure and unique to your account.</li>
                </ul>
              </div>
            </div>
          ) : isLoadingPayment ? (
            <div className="flex justify-center items-center py-8">
              <Loader2Icon className="w-6 h-6 animate-spin mr-2" />
              <span>Loading payment details...</span>
            </div>
          ) : !paymentInfo ? (
            <div className="text-center py-6">
              <AlertCircleIcon className="w-10 h-10 mx-auto text-destructive mb-2" />
              <h3 className="font-medium text-lg">Payment information not available</h3>
              <p className="text-muted-foreground mt-1">
                There was an error retrieving your payment details.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPaymentCreated(false);
                  createPaymentMutation.reset();
                }}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <CryptoWalletDisplay 
                walletAddress={paymentInfo.wallet.walletAddress}
                cryptoType={selectedCryptoType}
                amount={paymentInfo.payment.metadata?.amountCrypto || '0'}
                amountUsd={planPrice}
                referenceId={paymentInfo.payment.referenceId || ''}
                expiresAt={new Date(paymentInfo.payment.expiresAt)}
                onVerify={() => setTransactionHash('')}
                onRefresh={() => refetchPayment()}
                isVerifying={verifyPaymentMutation.isPending}
              />
              
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-hash">Transaction Hash/ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="transaction-hash"
                      placeholder="Enter your transaction hash here"
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                    />
                    <Button 
                      onClick={handleVerifyPayment}
                      disabled={verifyPaymentMutation.isPending || !transactionHash.trim()}
                    >
                      {verifyPaymentMutation.isPending ? (
                        <RefreshCwIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                  {verificationResult && (
                    <div className={`p-2 rounded text-sm ${verificationResult.confirmed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {verificationResult.message}
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground mt-4">
                  <p>
                    After sending the payment, paste the transaction hash/ID from your wallet or 
                    blockchain explorer to verify your payment.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className={paymentCreated ? 'justify-between' : 'justify-end'}>
          {paymentCreated ? (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          
          {!paymentCreated && (
            <Button 
              onClick={handleCreatePayment}
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Preparing Payment...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Dialog open={showVerificationSuccess} onOpenChange={setShowVerificationSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              Payment Successful
            </DialogTitle>
            <DialogDescription>
              Your cryptocurrency payment has been successfully verified and your subscription is now active.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Thank you for subscribing to the <strong>{planName}</strong> plan. You now have access to all 
              the features included in this subscription tier.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSuccessClose}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}