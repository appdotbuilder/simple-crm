import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, HandshakeIcon } from 'lucide-react';

import { CompaniesManager } from '@/components/CompaniesManager';
import { CustomersManager } from '@/components/CustomersManager';
import { DealsManager } from '@/components/DealsManager';

function App() {
  const [activeTab, setActiveTab] = useState('companies');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CRM Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your companies, customers, and deals</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <HandshakeIcon className="w-4 h-4" />
              Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Management
                </CardTitle>
                <CardDescription>
                  Manage your company records, including industry details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompaniesManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  Manage your customer records and their company associations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandshakeIcon className="w-5 h-5" />
                  Deal Management
                </CardTitle>
                <CardDescription>
                  Track and manage your sales deals through the pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DealsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;