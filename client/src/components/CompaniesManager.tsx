import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, Trash2, Globe, Phone, MapPin } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Company, CreateCompanyInput, UpdateCompanyInput } from '../../../server/src/schema';

export function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: '',
    industry: null,
    website: null,
    phone: null,
    address: null
  });

  const loadCompanies = useCallback(async () => {
    try {
      const result = await trpc.getCompanies.query();
      setCompanies(result);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const resetForm = () => {
    setFormData({
      name: '',
      industry: null,
      website: null,
      phone: null,
      address: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createCompany.mutate(formData);
      setCompanies((prev: Company[]) => [...prev, response]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateCompanyInput = {
        id: editingCompany.id,
        ...formData
      };
      const response = await trpc.updateCompany.mutate(updateData);
      setCompanies((prev: Company[]) => 
        prev.map((company: Company) => company.id === response.id ? response : company)
      );
      setIsEditDialogOpen(false);
      setEditingCompany(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteCompany.mutate({ id });
      setCompanies((prev: Company[]) => prev.filter((company: Company) => company.id !== id));
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry,
      website: company.website,
      phone: company.phone,
      address: company.address
    });
    setIsEditDialogOpen(true);
  };

  const CompanyForm = ({ onSubmit, isEdit = false }: { onSubmit: (e: React.FormEvent) => Promise<void>; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCompanyInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter company name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          value={formData.industry || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCompanyInput) => ({ ...prev, industry: e.target.value || null }))
          }
          placeholder="e.g., Technology, Healthcare"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCompanyInput) => ({ ...prev, website: e.target.value || null }))
          }
          placeholder="https://example.com"
          type="url"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCompanyInput) => ({ ...prev, phone: e.target.value || null }))
          }
          placeholder="(555) 123-4567"
          type="tel"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateCompanyInput) => ({ ...prev, address: e.target.value || null }))
          }
          placeholder="Company address"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingCompany(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Company' : 'Create Company')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Companies ({companies.length})</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
              <DialogDescription>
                Add a new company to your CRM system.
              </DialogDescription>
            </DialogHeader>
            <CompanyForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg mb-4">No companies yet</p>
          <p className="text-gray-400">Create your first company to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company: Company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(company)}
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
                            This will permanently delete "{company.name}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(company.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {company.industry && (
                  <Badge variant="secondary" className="w-fit">
                    {company.industry}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {company.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 truncate"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="line-clamp-2">{company.address}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400 pt-2">
                  Created: {company.created_at.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update the company information.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm onSubmit={handleEdit} isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}