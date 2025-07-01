import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface Transaction {
  type: 'purchase' | 'deposit';
  title: string;
  amount: number;
  date: string;
}

const useTransactions = (refreshInterval: number) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const apiOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
            endDate: new Date().toISOString(),
          }),
        };

        const [purchasesRes, depositsRes] = await Promise.all([
          fetch('/api/user/fetch/purchases', apiOptions),
          fetch('/api/user/fetch/deposits', apiOptions),
        ]);

        if (!purchasesRes.ok || !depositsRes.ok) throw new Error('Failed to fetch transactions.');

        const purchases = await purchasesRes.json();
        const deposits = await depositsRes.json();

        const allTransactions = [
          ...purchases.map((p: any) => ({ ...p, type: 'purchase' })),
          ...deposits.map((d: any) => ({ ...d, type: 'deposit' })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(allTransactions.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    const intervalId = setInterval(fetchTransactions, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return { transactions, loading, error };
};

const RecentTransactions: React.FC<{ refreshInterval?: number }> = ({ refreshInterval = 60000 }) => {
  const { transactions, loading, error } = useTransactions(refreshInterval);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={4}>
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (transactions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-muted-foreground">
            No recent transactions found.
          </TableCell>
        </TableRow>
      );
    }

    return transactions.map((item, index) => (
      <TableRow key={index}>
        <TableCell className="font-medium">{item.type === 'deposit' ? 'Deposit' : 'Purchase'}</TableCell>
        <TableCell>{item.title}</TableCell>
        <TableCell className={item.type === 'deposit' ? 'text-green-500' : 'text-red-500'}>
          {item.type === 'deposit' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">{formatDate(item.date)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderContent()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;