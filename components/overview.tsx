/* eslint-disable @next/next/no-img-element */
import { motion } from 'framer-motion';
import type { Session } from 'next-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionIndicator } from './subscription-indicator';

export const Overview = ({ user }: { user: Session['user'] | undefined }) => {
  // Get subscription data if user is logged in
  const subscription = useSubscription(user?.id);
  
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center mb-36">
          <img
            src="/images/modelmixlogo.png"
            alt="Agentic ModelMix Logo"
            width={241}
            height={48}
            className="w-auto h-12"
          />
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300">
          Hi,{' '}
          <span className="text-primary/80">
            {user?.preferredName || user?.name || 'there'}
          </span>
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-4xl font-medium mb-4 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400">
          How can I help you today?
        </h2>
        
        {/* Show subscription status for logged-in users */}
        {user && (
          <div className="mt-8 max-w-md mx-auto">
            <SubscriptionIndicator
              plan={subscription.plan}
              remainingConversations={subscription.remainingConversations}
              isLoading={subscription.isLoading}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
