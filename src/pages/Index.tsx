
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Wrench, Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Building className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Property Management System</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your property management with our comprehensive solution for admins, tenants, and public authorities.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="mr-4">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Property Management</CardTitle>
              <CardDescription>
                Manage properties and rooms with comprehensive CRUD operations and occupancy tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Add and manage properties</li>
                <li>• Room inventory management</li>
                <li>• Occupancy dashboard</li>
                <li>• Search and filter capabilities</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Complete tenant lifecycle management with profile creation and room assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Tenant profile management</li>
                <li>• Room assignment tracking</li>
                <li>• Move-in/move-out dates</li>
                <li>• Tenancy history</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Wrench className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Maintenance Tracking</CardTitle>
              <CardDescription>
                Log and track maintenance issues with status updates and vendor assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Issue logging system</li>
                <li>• Status tracking</li>
                <li>• Vendor assignment</li>
                <li>• Maintenance history</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Role-Based Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Admin</h3>
              <p className="text-gray-600">
                Full access to manage properties, rooms, tenants, and maintenance issues
              </p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tenant</h3>
              <p className="text-gray-600">
                View personal information, room details, and track maintenance requests
              </p>
            </div>
            <div className="text-center">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Public Authority</h3>
              <p className="text-gray-600">
                Read-only access to property and room information for regulatory oversight
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Join our property management system and streamline your operations today.
          </p>
          <Button asChild size="lg">
            <Link to="/auth">
              Sign Up Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
