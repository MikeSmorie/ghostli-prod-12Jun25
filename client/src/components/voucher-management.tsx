import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ticket, Plus, Settings, HelpCircle, Users, Gift, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const createVoucherSchema = z.object({
  voucherCode: z.string().min(3).max(50),
  type: z.enum(["discount", "referral"]),
  valueType: z.enum(["credits", "percentage_discount", "dollar_discount"]),
  valueAmount: z.number().min(0),
  maxUses: z.number().min(1).optional(),
  perUserLimit: z.number().min(1).optional(),
  expiryDate: z.string().optional(),
  tierRestriction: z.string().optional(),
});

interface Voucher {
  id: number;
  voucherCode: string;
  type: string;
  valueType: string;
  valueAmount: string;
  maxUses: number | null;
  perUserLimit: number;
  expiryDate: string | null;
  isActive: boolean;
  tierRestriction: string | null;
  totalUses: number;
  createdAt: string;
}

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [referralProgramEnabled, setReferralProgramEnabled] = useState(true);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(createVoucherSchema),
    defaultValues: {
      voucherCode: "",
      type: "discount" as const,
      valueType: "credits" as const,
      valueAmount: 0,
      perUserLimit: 1,
    },
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/voucher/admin/list", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVouchers(data.vouchers || []);
      }
    } catch (error) {
      console.error("Failed to fetch vouchers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVoucher = async (data: any) => {
    try {
      const response = await fetch("/api/voucher/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Voucher Created",
          description: "Voucher created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchVouchers();
      } else {
        toast({
          title: "Creation Failed",
          description: result.message || "Failed to create voucher",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create voucher",
        variant: "destructive"
      });
    }
  };

  const toggleVoucherStatus = async (voucherId: number, isActive: boolean) => {
    try {
      const response = await fetch("/api/voucher/admin/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ voucherId, isActive })
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Voucher ${isActive ? 'activated' : 'deactivated'}`,
        });
        fetchVouchers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update voucher status",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const getVoucherTypeBadge = (type: string) => {
    return type === "referral" ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Users className="h-3 w-3 mr-1" />
        Referral
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Gift className="h-3 w-3 mr-1" />
        Discount
      </Badge>
    );
  };

  const getValueDisplay = (voucher: Voucher) => {
    switch (voucher.valueType) {
      case "credits":
        return `${voucher.valueAmount} credits`;
      case "percentage_discount":
        return `${voucher.valueAmount}% off`;
      case "dollar_discount":
        return `$${voucher.valueAmount} off`;
      default:
        return voucher.valueAmount;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6" />
              Voucher & Referral Management
            </h2>
            <p className="text-muted-foreground">Create and manage discount vouchers and referral codes</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Referral Program:</span>
              <Switch
                checked={referralProgramEnabled}
                onCheckedChange={setReferralProgramEnabled}
              />
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle referral program ON/OFF globally</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Voucher
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Voucher</DialogTitle>
                  <DialogDescription>
                    Create a new discount voucher or referral code with custom settings
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateVoucher)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="voucherCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Voucher Code
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unique code entered by user</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="SAVE20" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Type
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Discount (promo) or Referral (tracking referrals)</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="discount">Discount</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="valueType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Value Type
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>How this voucher rewards users</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="credits">Credits</SelectItem>
                                <SelectItem value="percentage_discount">% Discount</SelectItem>
                                <SelectItem value="dollar_discount">$ Discount</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="valueAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Max Uses
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Max total times this code can be used</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Unlimited"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="perUserLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Per User Limit
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Max times each user can use this</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tierRestriction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tier Restriction</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="All tiers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Tiers</SelectItem>
                                <SelectItem value="FREE">Free Only</SelectItem>
                                <SelectItem value="PRO">Pro Only</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Voucher</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Vouchers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Vouchers</CardTitle>
            <CardDescription>
              Manage discount vouchers and view usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading vouchers...</div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No vouchers created yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono font-medium">
                        {voucher.voucherCode}
                      </TableCell>
                      <TableCell>
                        {getVoucherTypeBadge(voucher.type)}
                      </TableCell>
                      <TableCell>{getValueDisplay(voucher)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {voucher.totalUses}
                          {voucher.maxUses && ` / ${voucher.maxUses}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(voucher.expiryDate)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={voucher.isActive}
                          onCheckedChange={(checked) => toggleVoucherStatus(voucher.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}