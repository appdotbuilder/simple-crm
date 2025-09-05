import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Mail, Phone, Building2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Customer, CreateCustomerInput, UpdateCustomerInput, Company } from '../../../server/src/schema';

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: null,
    company_id: 0
  });

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
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

  useEffect(() => {
    loadCustomers();
    loadCompanies();
  }, [loadCustomers, loadCompanies]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: null,
      company_id: 0
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCustomer.mutate(formData);
      setCustomers((prev: Customer[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateCustomerInput = {
        id: editingCustomer.id,
        ...formData
      };
      const response = await trpc.updateCustomer.mutate(updateData);
      setCustomers((prev: Customer[]) => 
        prev.map((customer: Customer) => customer.id === response.id ? response : customer)
      );
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteCustomer.mutate({ id });
      setCustomers((prev: Customer[]) => prev.filter((customer: Customer) => customer.id !== id));
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company_id: customer.company_id
    });
    setIsEditDialogOpen(true);
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: Company) => c.id === companyId);
    return company ? company.name : 'Unknown Company';
  };

  const CustomerForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => Promise<void>; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Customer Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter customer name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value }))
          }
          placeholder="customer@example.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCustomerInput) => ({ ...prev, phone: e.target.value || null }))
          }
          placeholder="(555) 123-4567"
          type="tel"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Company *</Label>
        <Select
          value={formData.company_id.toString()}
          onValueChange={(value: string) =>
            setFormData((prev: CreateCustomerInput) => ({ ...prev, company_id: parseInt(value) }))
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
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingCustomer(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || formData.company_id === 0}>
          {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Customer' : 'Create Customer')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Customers ({customers.length})</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" disabled={companies.length === 0}>
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your CRM system.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No companies available</p>
          <p className="text-gray-400">Please create a company first before adding customers.</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No customers yet</p>
          <p className="text-gray-400">Create your first customer to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: Customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(customer)}
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
                            This will permanently delete "{customer.name}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(customer.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  <Building2 className="w-3 h-3 mr-1" />
                  {getCompanyName(customer.company_id)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="hover:text-blue-600 truncate"
                  >
                    {customer.email}
                  </a>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:text-blue-600"
                    >
                      {customer.phone}
                    </a>
                  </div>
                )}
                <div className="text-xs text-gray-400 pt-2">
                  Created: {customer.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer information.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm onSubmit={handleEdit} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}