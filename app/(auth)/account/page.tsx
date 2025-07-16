import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { AccountSettings } from '@/components/account-settings';

export default async function AccountPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return <AccountSettings user={session.user} />;
}