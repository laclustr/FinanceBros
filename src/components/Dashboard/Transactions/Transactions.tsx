"use client";

import * as React from "react";
import { MoreHorizontal, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const useMediaQuery = (query) => {
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

type Transaction = {
  id: number;
  type: 'purchase' | 'deposit';
  title: string;
  amount: number;
  date: string;
  bankAccountId: number;
};

export function TransactionManager() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [allTransactions, setAllTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  const [filters, setFilters] = React.useState({
    name: "",
    type: "all",
    maxAmount: "",
    date: "",
    sortBy: "date-desc",
  });

  const [isEditModalOpen, setEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [isFilterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const ITEMS_PER_PAGE = 20;

  const api = {
    fetchTransactions: async (): Promise<Transaction[]> => {
      await new Promise(res => setTimeout(res, 1000));
      const purchases = Array.from({ length: 35 }, (_, i) => ({
        id: 1000 + i,
        title: `Purchase Item ${i + 1}`,
        amount: Math.random() * 200 + 5,
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        bankAccountId: (i % 3) + 1,
        type: 'purchase' as const,
      }));
      const deposits = Array.from({ length: 10 }, (_, i) => ({
        id: 2000 + i,
        title: `Paycheck Deposit ${i + 1}`,
        amount: Math.random() * 1500 + 1000,
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        bankAccountId: (i % 2) + 1,
        type: 'deposit' as const,
      }));
      return [...purchases, ...deposits];
    },
    updateTransaction: async (data: Partial<Transaction>) => {
      console.log("Simulating update:", data);
      setAllTransactions(prev =>
        prev.map(t => (t.id === data.id && t.type === data.type ? { ...t, ...data } : t))
      );
      return { ok: true };
    },
    deleteTransaction: async (transaction: Transaction) => {
      console.log("Simulating delete:", transaction);
      setAllTransactions(prev =>
        prev.filter(t => !(t.id === transaction.id && t.type === transaction.type))
      );
      return { ok: true };
    },
  };

  React.useEffect(() => {
    setIsLoading(true);
    api.fetchTransactions()
      .then(data => {
        setAllTransactions(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch transactions:", err);
        setIsLoading(false);
      });
  }, []);

  const filteredTransactions = React.useMemo(() => {
    let transactions = [...allTransactions];
    
    transactions = transactions.filter(t => {
      const matchName = !filters.name || t.title.toLowerCase().includes(filters.name.toLowerCase());
      const matchType = filters.type === 'all' || t.type === filters.type;
      const matchAmount = !filters.maxAmount || Math.abs(t.amount) <= parseFloat(filters.maxAmount);
      const matchDate = !filters.date || t.date.slice(0, 10) === filters.date;
      return matchName && matchType && matchAmount && matchDate;
    });

    transactions.sort((a, b) => {
      switch (filters.sortBy) {
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc": return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-asc": return Math.abs(a.amount) - Math.abs(b.amount);
        default: return new Date(b.date).getTime() - new Date(a.date).getTime(); // date-desc
      }
    });

    return transactions;
  }, [allTransactions, filters]);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  
  const handleApplyFilters = () => {
    // Logic is already applied via useMemo, this just closes the sheet on mobile
    if (isMobile) {
      setFilterSheetOpen(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ name: "", type: "all", maxAmount: "", date: "", sortBy: "date-desc" });
    setCurrentPage(1);
    if (isMobile) {
      setFilterSheetOpen(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };
  
  const handleDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedTransaction) {
      await api.deleteTransaction(selectedTransaction);
      setDeleteAlertOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // --- Reusable Filter Controls Component ---
  const FilterControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Input
        placeholder="Name"
        value={filters.name}
        onChange={(e) => handleFilterChange("name", e.target.value)}
        className="md:col-span-1"
      />
      <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
        <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="purchase">Purchase</SelectItem>
          <SelectItem value="deposit">Deposit</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        placeholder="Max Amount"
        value={filters.maxAmount}
        onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
      />
      <Input
        type="date"
        value={filters.date}
        onChange={(e) => handleFilterChange("date", e.target.value)}
      />
      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
        <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">Date (Newest)</SelectItem>
          <SelectItem value="date-asc">Date (Oldest)</SelectItem>
          <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
          <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // --- Render ---
  return (
    <section className="max-w-4xl mx-auto p-4">
      {/* --- Filter Trigger for Mobile --- */}
      {isMobile ? (
         <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="mb-4">
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <FilterControls />
                </div>
                <SheetFooter>
                    <Button variant="ghost" onClick={handleClearFilters}>Clear</Button>
                    <Button onClick={handleApplyFilters}>Apply</Button>
                </SheetFooter>
            </SheetContent>
         </Sheet>
      ) : (
        <Card className="mb-6 p-4">
          <FilterControls />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={handleClearFilters}>Clear</Button>
            <Button onClick={handleApplyFilters}>Apply</Button>
          </div>
        </Card>
      )}

      {/* --- Main Content: Table or Cards --- */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A list of your recent transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8">Loading...</div>
          ) : isMobile ? (
            // --- Mobile Card View ---
            <div className="space-y-4">
              {paginatedTransactions.map((t) => (
                <Card key={`${t.type}-${t.id}`} className="w-full">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium truncate">{t.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                       <p className={`font-semibold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                           {t.type === 'deposit' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                       </p>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => handleEdit(t)}>Edit</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleDelete(t)} className="text-red-600">Delete</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // --- Desktop Table View ---
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
                      <TableCell className={t.type === 'deposit' ? 'text-green-600' : ''}>
                        ${Math.abs(t.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'deposit' ? 'default' : 'secondary'}>
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(t)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(t)} className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* --- Pagination Controls --- */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} aria-disabled={currentPage === 1} />
                </PaginationItem>
                {/* Simplified pagination links for brevity */}
                {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(i + 1)} isActive={currentPage === i + 1}>
                            {i + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} aria-disabled={currentPage === totalPages} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}

      {/* --- Edit Modal --- */}
      <EditTransactionDialog
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTransaction}
        onSave={api.updateTransaction}
      />

      {/* --- Delete Confirmation Dialog --- */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransaction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// --- Sub-component for the Edit Dialog ---
// Kept in the same file for simplicity as requested.
function EditTransactionDialog({ isOpen, onClose, transaction, onSave }) {
    const [formData, setFormData] = React.useState({ title: '', amount: '', date: '', type: 'purchase' });

    React.useEffect(() => {
        if (transaction) {
            setFormData({
                title: transaction.title,
                amount: String(Math.abs(transaction.amount)),
                date: new Date(transaction.date).toISOString().split('T')[0], // Format for <input type="date">
                type: transaction.type,
            });
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleTypeChange = (value) => {
        setFormData(prev => ({ ...prev, type: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave({
            ...transaction,
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date(formData.date).toISOString()
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" name="title" value={formData.title} onChange={handleChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Type</Label>
                             <Select value={formData.type} onValueChange={handleTypeChange}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
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