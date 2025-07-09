'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status, router]);

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
            Get Everything You Want
          </blockquote>
          <p className="text-purple-100 text-lg">
            The future of AI-powered conversations starts here.
          </p>
        </div>
        <div className="text-sm text-purple-200">
          <p>&ldquo;The only way to do great work is to love what you do.&rdquo;</p>
          <p className="font-medium">— Steve Jobs</p>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="flex items-center justify-center p-8 md:p-12 lg:p-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>
          
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton 
              isSuccessful={isSuccessful} 
              className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Sign in
            </SubmitButton>
            
            <p className="text-center text-sm text-gray-600 mt-6">
              Don&apos;t have an account?{' '}
              <Link 
                href="/register" 
                className="font-medium text-purple-700 hover:text-purple-600"
              >
                Sign up
              </Link>
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
