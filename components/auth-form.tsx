import Form from 'next/form';
import Link from 'next/link';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
  showPreferredName = false,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  showPreferredName?: boolean;
}) {
  return (
    <Form action={action} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            className="w-full px-4 py-3 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            autoFocus
            defaultValue={defaultEmail}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Link 
              href="/forgot-password" 
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            className="w-full px-4 py-3 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-700">
            Remember me
          </label>
        </div>
        {showPreferredName && (
          <div className="space-y-2">
            <Label 
              htmlFor="preferredName" 
              className="text-sm font-medium text-gray-700"
            >
              Preferred Name (Optional)
            </Label>
            <Input
              id="preferredName"
              name="preferredName"
              className="w-full px-4 py-3 text-base border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              type="text"
              placeholder="How would you like to be called?"
            />
          </div>
        )}
      </div>
      {children}
    </Form>
  );
}
