import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Plus, 
  History, 
  Loader2, 
  CreditCard,
  Bitcoin,
  Wallet
} from "lucide-react";

interface CreditTransaction {
  id: number;
  transactionType: string;
  amount: number;
  source: string;
  txId: string | null;
  createdAt: string;
}

interface CreditsDisplayProps {
  showHistory?: boolean;
  showPurchaseButton?: boolean;
  compact?: boolean;
}

export function CreditsDisplay({ 
  showHistory = false, 
  showPurchaseButton = true, 
  compact = false 
}: CreditsDisplayProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");

  // Fetch user's credit balance
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ["/api/credits/balance"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/balance");
      return await response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch credit transaction history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/credits/history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/credits/history");
      return await response.json();
    },
    enabled: historyOpen && !!user,
  });

  // Purchase credits mutation
  const purchaseCreditsMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string }) => {
      const response = await apiRequest("POST", "/api/credits/purchase", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Credits Added Successfully",
        description: `${data.amount || purchaseAmount} credits have been added to your account`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      setPurchaseAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase credits",
        variant: "destructive",
      });
    },
  });

  const handlePurchaseCredits = () => {
    const amount = parseInt(purchaseAmount);
    if (amount > 0) {
      purchaseCreditsMutation.mutate({
        amount,
        paymentMethod: "Manual",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "USAGE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "BONUS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ADJUSTMENT":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">
          {creditsLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            credits?.credits || 0
          )}
        </span>
        <span className="text-muted-foreground">credits</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Ghostli Credits
        </CardTitle>
        <CardDescription>
          Your credit balance for content generation and premium features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {creditsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                credits?.credits || 0
              )}
            </div>
            <p className="text-sm text-muted-foreground">Available Credits</p>
          </div>
          
          <div className="flex gap-2">
            {showHistory && (
              <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Credit Transaction History</DialogTitle>
                    <DialogDescription>
                      View all your credit purchases, usage, and adjustments
                    </DialogDescription>
                  </DialogHeader>
                  
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Transaction ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyData?.transactions?.map((transaction: CreditTransaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-mono text-xs">
                                {formatDate(transaction.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                                  {transaction.transactionType}
                                </Badge>
                              </TableCell>
                              <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                              </TableCell>
                              <TableCell>{transaction.source}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {transaction.txId || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!historyData?.transactions || historyData.transactions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No transactions found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
            
            {showPurchaseButton && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Purchase Credits</DialogTitle>
                    <DialogDescription>
                      Add credits to your account for content generation and premium features
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Credit Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter number of credits"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        min="1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPurchaseAmount("100")}
                      >
                        100 Credits
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPurchaseAmount("500")}
                      >
                        500 Credits
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPurchaseAmount("1000")}
                      >
                        1000 Credits
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Methods</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={handlePurchaseCredits}
                          disabled={!purchaseAmount || purchaseCreditsMutation.isPending}
                        >
                          <CreditCard className="h-4 w-4" />
                          PayPal
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={handlePurchaseCredits}
                          disabled={!purchaseAmount || purchaseCreditsMutation.isPending}
                        >
                          <Bitcoin className="h-4 w-4" />
                          Bitcoin
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={handlePurchaseCredits}
                          disabled={!purchaseAmount || purchaseCreditsMutation.isPending}
                        >
                          <Wallet className="h-4 w-4" />
                          Manual
                        </Button>
                      </div>
                    </div>
                    
                    {purchaseCreditsMutation.isPending && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Processing purchase...</span>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Credits are used for content generation, AI features, and premium tools.
        </div>
      </CardContent>
    </Card>
  );
}