'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';
import { toast } from '@/components/toast';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'user_exists') {
      toast({ type: 'error', description: 'Account already exists!' });
    } else if (state.status === 'failed') {
      toast({ type: 'error', description: 'Failed to create account!' });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      toast({ type: 'success', description: 'Account created successfully!' });

      setIsSuccessful(true);
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-white">
      {/* Left side with gradient background */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 p-12 text-white">
        <div className="text-2xl font-bold">ModelMix</div>
        <div className="space-y-4">
          <blockquote className="text-4xl font-serif font-bold leading-tight">
            Join Our Community
          </blockquote>
          <p className="text-purple-100 text-lg">
            Start your journey with AI-powered conversations today.
          </p>
        </div>
        <div className="text-sm text-purple-200">
          <p>&ldquo;The future belongs to those who believe in the beauty of their dreams.&rdquo;</p>
          <p className="font-medium">— Eleanor Roosevelt</p>
        </div>
      </div>

      {/* Right side with register form */}
      <div className="flex items-center justify-center p-8 md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join us to get started</p>
          </div>
          
          <AuthForm action={handleSubmit} showPreferredName defaultEmail={email}>
            <SubmitButton 
              isSuccessful={isSuccessful} 
              className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Create account
            </SubmitButton>
            
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-purple-700 hover:text-purple-600"
              >
                Sign in
              </Link>
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
