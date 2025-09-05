import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HandshakeIcon, Plus, Edit, Trash2, DollarSign, Users, Building2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Deal, CreateDealInput, UpdateDealInput, Company, Customer, DealStatus } from '../../../server/src/schema';

const statusColors: Record<DealStatus, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Qualified': 'bg-yellow-100 text-yellow-800',
  'Proposal': 'bg-purple-100 text-purple-800',
  'Won': 'bg-green-100 text-green-800',
  'Lost': 'bg-red-100 text-red-800'
};

const statusOptions: DealStatus[] = ['New', 'Qualified', 'Proposal', 'Won', 'Lost'];

export function DealsManager() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const [formData, setFormData] = useState<CreateDealInput>({
    description: '',
    amount: 0,
    status: 'New',
    customer_id: 0,
    company_id: 0
  });

  const loadDeals = useCallback(async () => {
    try {
      const result = await trpc.getDeals.query();
      setDeals(result);
    } catch (error) {
      console.error('Failed to load deals:', error);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const result = await trpc.getCompanies.query();
      setCompanies(result);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadDeals();
    loadCompanies();
    loadCustomers();
  }, [loadDeals, loadCompanies, loadCustomers]);

  // Filter customers based on selected company
  useEffect(() => {
    if (formData.company_id === 0) {
      setFilteredCustomers([]);
    } else {
      const filtered = customers.filter((customer: Customer) => customer.company_id === formData.company_id);
      setFilteredCustomers(filtered);
      // Reset customer selection if current customer is not in the new company
      if (formData.customer_id !== 0) {
        const customerExists = filtered.some((customer: Customer) => customer.id === formData.customer_id);
        if (!customerExists) {
          setFormData((prev: CreateDealInput) => ({ ...prev, customer_id: 0 }));
        }
      }
    }
  }, [formData.company_id, customers, formData.customer_id]);

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      status: 'New',
      customer_id: 0,
      company_id: 0
    });
    setFilteredCustomers([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createDeal.mutate(formData);
      setDeals((prev: Deal[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateDealInput = {
        id: editingDeal.id,
        ...formData
      };
      const response = await trpc.updateDeal.mutate(updateData);
      setDeals((prev: Deal[]) => 
        prev.map((deal: Deal) => deal.id === response.id ? response : deal)
      );
      setIsEditDialogOpen(false);
      setEditingDeal(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update deal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteDeal.mutate({ id });
      setDeals((prev: Deal[]) => prev.filter((deal: Deal) => deal.id !== id));
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      description: deal.description,
      amount: deal.amount,
      status: deal.status,
      customer_id: deal.customer_id,
      company_id: deal.company_id
    });
    setIsEditDialogOpen(true);
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: Company) => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getTotalValue = () => {
    return deals.reduce((sum: number, deal: Deal) => sum + deal.amount, 0);
  };

  const getWonDeals = () => {
    return deals.filter((deal: Deal) => deal.status === 'Won');
  };

  const DealForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => Promise<void>; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Deal Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateDealInput) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe the deal..."
          rows={3}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateDealInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
          }
          placeholder="0.00"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: DealStatus) =>
            setFormData((prev: CreateDealInput) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status: DealStatus) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Company *</Label>
        <Select
          value={formData.company_id.toString()}
          onValueChange={(value: string) =>
            setFormData((prev: CreateDealInput) => ({ ...prev, company_id: parseInt(value) }))
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company: Company) => (
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="customer">Customer *</Label>
        <Select
          value={formData.customer_id.toString()}
          onValueChange={(value: string) =>
            setFormData((prev: CreateDealInput) => ({ ...prev, customer_id: parseInt(value) }))
          }
          required
          disabled={filteredCustomers.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              formData.company_id === 0 ? "Select a company first" : 
              filteredCustomers.length === 0 ? "No customers in this company" :
              "Select a customer"
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredCustomers.map((customer: Customer) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingDeal(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || formData.company_id === 0 || formData.customer_id === 0}>
          {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Deal' : 'Create Deal')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Deals ({deals.length})</h2>
          <div className="flex gap-4 text-sm">
            <div className="text-green-600 font-semibold">
              Won: ${getWonDeals().reduce((sum: number, deal: Deal) => sum + deal.amount, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">
              Total: ${getTotalValue().toLocaleString()}
            </div>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" disabled={companies.length === 0 || customers.length === 0}>
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
              <DialogDescription>
                Add a new deal to your CRM system.
              </DialogDescription>
            </DialogHeader>
            <DealForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 || customers.length === 0 ? (
        <div className="text-center py-12">
          <HandshakeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">Prerequisites missing</p>
          <p className="text-gray-400">
            Please create {companies.length === 0 ? 'companies' : ''} 
            {companies.length === 0 && customers.length === 0 ? ' and ' : ''}
            {customers.length === 0 ? 'customers' : ''} first before adding deals.
          </p>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12">
          <HandshakeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No deals yet</p>
          <p className="text-gray-400">Create your first deal to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal: Deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{deal.description}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[deal.status]}>
                        {deal.status}
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {deal.amount.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(deal)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this deal and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(deal.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{getCustomerName(deal.customer_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{getCompanyName(deal.company_id)}</span>
                </div>
                <div className="text-xs text-gray-400 pt-2">
                  Created: {deal.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
            <DialogDescription>
              Update the deal information.
            </DialogDescription>
          </DialogHeader>
          <DealForm onSubmit={handleEdit} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}