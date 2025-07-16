'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionManagement } from '@/components/subscription-management';
import { Loader2 } from 'lucide-react';
import type { User } from 'next-auth';

interface AccountSettingsProps {
  user: User;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [securityConfirmation, setSecurityConfirmation] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteAccount = async () => {
    if (securityConfirmation !== 'I am agentic') {
      alert('Security confirmation does not match. Please try again.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to logout or home page after successful deletion
        window.location.href = '/';
      } else {
        const data = await response.json();
        alert(`Failed to delete account: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Account Settings</h1>
        
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="mb-4 mx-auto flex justify-center">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  View and manage your subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionManagement userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                  {/* Additional profile settings can be added here in the future */}
                  
                  <div className="pt-6 mt-6 border-t">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                    
                    {!showDeleteConfirmation ? (
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Delete Account
                      </button>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-4">
                        <p className="text-sm text-red-800">
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </p>
                        
                        <div>
                          <label htmlFor="security-confirmation" className="block text-sm font-medium text-red-700 mb-1">
                            To confirm, type "I am agentic" below:
                          </label>
                          <input
                            id="security-confirmation"
                            type="text"
                            value={securityConfirmation}
                            onChange={(e) => setSecurityConfirmation(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="I am agentic"
                          />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || securityConfirmation !== 'I am agentic'}
                            className={`${
                              securityConfirmation === 'I am agentic'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-red-300 cursor-not-allowed'
                            } text-white px-4 py-2 rounded-md transition-colors flex items-center`}
                          >
                            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Permanently Delete Account
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowDeleteConfirmation(false);
                              setSecurityConfirmation('');
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}