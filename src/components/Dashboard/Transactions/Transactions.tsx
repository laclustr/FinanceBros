"use client";

import * as React from "react";
import { MoreHorizontal, Filter, X, SlidersHorizontal, FolderSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatCurrency, parseCurrency } from "@/lib/utilities/currencyFormat";

// --- Custom Hook for Media Queries ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

// --- Type Definition ---
type Transaction = {
  id: number;
  type: 'purchase' | 'deposit';
  title: string;
  amount: number;
  date: string;
  bankAccountId: number;
};

// --- (API Functions: fetchTransactions, updateTransaction, deleteTransaction) ---
// Note: Your original API functions are assumed to be working correctly and are kept as is.
// They are omitted here for brevity but should be included in your final file.
async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 365); // Last 365 days

    const apiRequestBody = JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: apiRequestBody,
    };

    const [purchasesRes, depositsRes] = await Promise.all([
      fetch('/api/user/fetch/purchases', requestOptions),
      fetch('/api/user/fetch/deposits', requestOptions)
    ]);

    if (!purchasesRes.ok || !depositsRes.ok) {
      throw new Error('Network response was not ok');
    }

    const purchases = await purchasesRes.json();
    const deposits = await depositsRes.json();

    const typedPurchases: Transaction[] = purchases.map((p: any) => ({ ...p, type: 'purchase' }));
    const typedDeposits: Transaction[] = deposits.map((d: any) => ({ ...d, type: 'deposit' }));

    return [...typedPurchases, ...typedDeposits];
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

async function updateTransaction(transactionData: Partial<Transaction>) {
  const { type, ...payload } = transactionData;
  const endpoint = type === 'purchase' ? '/api/user/edit/purchase' : '/api/user/edit/deposit';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update ${type}`);
  }
  return await response.json();
}

async function deleteTransaction(transaction: Transaction) {
  const { type, id } = transaction;
  const endpoint = type === 'purchase' ? '/api/user/delete/purchase' : '/api/user/delete/deposit';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete ${type}`);
  }
  return await response.json();
}


// --- Main Transaction Manager Component ---
export function TransactionManager() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedAccountId, setSelectedAccountId] = React.useState('all');

  const [filters, setFilters] = React.useState({
    name: "",
    type: "all",
    maxAmount: "",
    date: "",
    sortBy: "date-desc",
  });

  const [isEditModalOpen, setEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [isFilterSheetOpen, setFilterSheetOpen] = React.useState(false); // Only for mobile sheet
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const ITEMS_PER_PAGE = 20;

  // Effect to listen for account changes from an external component (e.g., BalanceSection)
  React.useEffect(() => {
    const handleAccountChange = (event: CustomEvent) => {
      setSelectedAccountId(event.detail.accountId);
      setCurrentPage(1); // Reset to first page on account change
    };
    window.addEventListener('accountChanged', handleAccountChange as EventListener);
    return () => window.removeEventListener('accountChanged', handleAccountChange as EventListener);
  }, []);

  // Effect to fetch initial transaction data
  React.useEffect(() => {
    setIsLoading(true);
    fetchTransactions()
      .then(data => setAllTransactions(data))
      .catch(err => console.error("Error in component:", err))
      .finally(() => setIsLoading(false));
  }, []);

  // Memoized filtering and sorting logic
  const filteredTransactions = React.useMemo(() => {
    let transactions = allTransactions.filter(t => {
      const matchAccount = selectedAccountId === 'all' || String(t.bankAccountId) === selectedAccountId;
      const matchName = !filters.name || t.title.toLowerCase().includes(filters.name.toLowerCase());
      const matchType = filters.type === 'all' || t.type === filters.type;
      const matchAmount = !filters.maxAmount || Math.abs(t.amount) <= parseFloat(filters.maxAmount);
      const matchDate = !filters.date || t.date.slice(0, 10) === filters.date;
      return matchAccount && matchName && matchType && matchAmount && matchDate;
    });

    transactions.sort((a, b) => {
      switch (filters.sortBy) {
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc": return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-asc": return Math.abs(a.amount) - Math.abs(b.amount);
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return transactions;
  }, [allTransactions, filters, selectedAccountId]);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ name: "", type: "all", maxAmount: "", date: "", sortBy: "date-desc" });
    setCurrentPage(1);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleSave = async (updatedData: Partial<Transaction>) => {
    try {
      await updateTransaction(updatedData);
      setAllTransactions(prev =>
        prev.map(t => (t.id === updatedData.id && t.type === updatedData.type ? { ...t, ...updatedData } : t))
      );
      setEditModalOpen(false);
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  };
  
  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedTransaction) {
      try {
        await deleteTransaction(selectedTransaction);
        setAllTransactions(prev =>
          prev.filter(t => !(t.id === selectedTransaction.id && t.type === selectedTransaction.type))
        );
        setDeleteAlertOpen(false);
        setSelectedTransaction(null);
      } catch (error) {
         console.error("Failed to delete transaction:", error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // Reusable component for the filter controls form
  const FilterControls = () => (
    <div className="grid grid-cols-1 gap-4 p-4 pb-0 pt-0">
        <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger id="type"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="maxAmount">Max Amount</Label>
            <Input
                id="maxAmount"
                type="number"
                placeholder="e.g., 500"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                <SelectTrigger id="sortBy"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );

  const EmptyState = () => (
      <div className="text-center py-16 text-gray-500">
          <FolderSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Transactions Found</h3>
          <p className="mt-1 text-sm text-gray-500">
              {selectedAccountId === 'all' ? 
              'No transactions match your current filters.' : 
              'No transactions found for this account.'}
          </p>
      </div>
  );

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

      {/* --- Filter Bar --- */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-grow">
          <Input
              placeholder="Filter by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              className="max-w-xs"
          />
        </div>
        {isMobile ? (
          <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader className="pb-0">
                  <SheetTitle >Filter Transactions</SheetTitle>
                </SheetHeader>
                <FilterControls />
                <SheetFooter className="mt-0 pt-0">
                    <Button variant="ghost" onClick={handleClearFilters}>Clear</Button>
                    <Button onClick={() => setFilterSheetOpen(false)}>Apply</Button>
                </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> More Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <FilterControls />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* --- Main Content: Table or Cards --- */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="text-center p-8">Loading...</div>
        ) : isMobile ? (
          paginatedTransactions.length > 0 ? (
            <div className="space-y-3">
              {paginatedTransactions.map((t) => (
                <Card key={`${t.type}-${t.id}`} className="py-0">
                  <CardContent className="flex items-center justify-between p-4 pr-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center ml-4">
                        <p className={`font-semibold text-base ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'deposit' ? '+' : '-'}{formatCurrency(String(t.amount))}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 ml-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(t)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(t)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <EmptyState />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((t) => (
                    <TableRow key={`${t.type}-${t.id}`}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className={t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                         {t.type === 'deposit' ? '+' : '-'}{formatCurrency(String(t.amount))}
                      </TableCell>
                      <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant={t.type === 'deposit' ? 'success' : 'outline'}>{t.type}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(t)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(t)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="h-48"><EmptyState /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* --- Pagination Controls --- */}
      {totalPages > 1 && (
        <Pagination>
            <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1} /></PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>{i + 1}</PaginationLink></PaginationItem>
                ))}
                <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === totalPages} /></PaginationItem>
            </PaginationContent>
        </Pagination>
      )}

      {/* --- Modals & Dialogs --- */}
      <EditTransactionDialog
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTransaction}
        onSave={handleSave}
      />
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction from the servers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}


function EditTransactionDialog({ isOpen, onClose, transaction, onSave }: { isOpen: boolean, onClose: () => void, transaction: Transaction | null, onSave: (data: Partial<Transaction>) => Promise<void> }) {
    const [formData, setFormData] = React.useState({ title: '', amount: '', date: '', type: 'purchase' });

    React.useEffect(() => {
        if (transaction) {
            setFormData({
                title: transaction.title,
                amount: formatCurrency(String(Math.abs(transaction.amount))),
                date: new Date(transaction.date).toISOString().split('T')[0],
                type: transaction.type,
            });
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatCurrency(e.target.value);
      setFormData(prev => ({ ...prev, amount: formattedValue }));
    }
    
    const handleTypeChange = (value: 'purchase' | 'deposit') => {
        setFormData(prev => ({ ...prev, type: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(parseCurrency(formData.amount));
        await onSave({
            ...transaction,
            ...formData,
            amount: numericAmount,
            date: new Date(formData.date).toISOString() // Ensure date is in ISO format
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" name="amount" value={formData.amount} onChange={handleAmountChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" value={formData.date} onChange={handleFormChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                             <Select value={formData.type} onValueChange={handleTypeChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="purchase">Purchase</SelectItem>
                                  <SelectItem value="deposit">Deposit</SelectItem>
                                </SelectContent>
                              </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}