import {
  GitHub,
  Google,
  Gmail,
  LinkedIn,
  Slack,
  Notion,
  X,
  Zoom,
  Discord,
  Codesandbox,
  Reddit,
  Asana,
  Confluence,
  Dropbox,
  E2b,
  Firecrawl,
  GoogleCalendar,
  GoogleContacts,
  GoogleDocs,
  GoogleDrive,
  GoogleFinance,
  GoogleFlights,
  GoogleHotels,
  GoogleJobs,
  GoogleMaps,
  GoogleNews,
  GoogleSearch,
  GoogleSheets,
  GoogleShopping,
  Hubspot,
  Jira,
  Linear,
  Microsoft,
  OutlookCalendar,
  OutlookMail,
  Spotify,
  Stripe,
  Walmart,
  Youtube,
} from '@/components/icons/index';

import { Ruler, Search } from 'lucide-react';

type AuthProvider = {
  provider_id: string;
  toolkit_id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const AuthProviders: AuthProvider[] = [
  {
    provider_id: 'arcade-google',
    toolkit_id: 'google',
    name: 'Google',
    icon: Google,
  },
  {
    provider_id: 'arcade-github',
    toolkit_id: 'github',
    name: 'GitHub',
    icon: GitHub,
  },
  {
    provider_id: 'arcade-slack',
    toolkit_id: 'slack',
    name: 'Slack',
    icon: Slack,
  },
  {
    provider_id: 'arcade-gmail',
    toolkit_id: 'gmail',
    name: 'Gmail',
    icon: Gmail,
  },
  {
    provider_id: 'arcade-linkedin',
    toolkit_id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedIn,
  },
  {
    provider_id: 'arcade-reddit',
    toolkit_id: 'reddit',
    name: 'Reddit',
    icon: Reddit,
  },
  {
    provider_id: 'arcade-notion',
    toolkit_id: 'notiontoolkit',
    name: 'Notion',
    icon: Notion,
  },
  {
    provider_id: 'arcade-x',
    toolkit_id: 'x',
    name: 'X',
    icon: X,
  },
  {
    provider_id: 'arcade-zoom',
    toolkit_id: 'zoom',
    name: 'Zoom',
    icon: Zoom,
  },
  {
    provider_id: 'discord',
    toolkit_id: 'discord',
    name: 'Discord',
    icon: Discord,
  },
  {
    provider_id: 'arcade-codesandbox',
    toolkit_id: 'codesandbox',
    name: 'Codesandbox',
    icon: Codesandbox,
  },
  {
    provider_id: 'arcade-math',
    toolkit_id: 'math',
    name: 'Math',
    icon: Ruler,
  },
  {
    provider_id: 'arcade-search',
    toolkit_id: 'search',
    name: 'Search',
    icon: Search,
  },
  // New service providers
  {
    provider_id: 'arcade-asana',
    toolkit_id: 'asana',
    name: 'Asana',
    icon: Asana,
  },
  {
    provider_id: 'arcade-confluence',
    toolkit_id: 'confluence',
    name: 'Confluence',
    icon: Confluence,
  },
  {
    provider_id: 'arcade-dropbox',
    toolkit_id: 'dropbox',
    name: 'Dropbox',
    icon: Dropbox,
  },
  {
    provider_id: 'arcade-e2b',
    toolkit_id: 'e2b',
    name: 'E2B',
    icon: E2b,
  },
  {
    provider_id: 'arcade-firecrawl',
    toolkit_id: 'firecrawl',
    name: 'Firecrawl',
    icon: Firecrawl,
  },
  {
    provider_id: 'arcade-google-calendar',
    toolkit_id: 'googlecalendar',
    name: 'Google Calendar',
    icon: GoogleCalendar,
  },
  {
    provider_id: 'arcade-google-contacts',
    toolkit_id: 'googlecontacts',
    name: 'Google Contacts',
    icon: GoogleContacts,
  },
  {
    provider_id: 'arcade-google-docs',
    toolkit_id: 'googledocs',
    name: 'Google Docs',
    icon: GoogleDocs,
  },
  {
    provider_id: 'arcade-google-drive',
    toolkit_id: 'googledrive',
    name: 'Google Drive',
    icon: GoogleDrive,
  },
  {
    provider_id: 'arcade-google-finance',
    toolkit_id: 'googlefinance',
    name: 'Google Finance',
    icon: GoogleFinance,
  },
  {
    provider_id: 'arcade-google-flights',
    toolkit_id: 'googleflights',
    name: 'Google Flights',
    icon: GoogleFlights,
  },
  {
    provider_id: 'arcade-google-hotels',
    toolkit_id: 'googlehotels',
    name: 'Google Hotels',
    icon: GoogleHotels,
  },
  {
    provider_id: 'arcade-google-jobs',
    toolkit_id: 'googlejobs',
    name: 'Google Jobs',
    icon: GoogleJobs,
  },
  {
    provider_id: 'arcade-google-maps',
    toolkit_id: 'googlemaps',
    name: 'Google Maps',
    icon: GoogleMaps,
  },
  {
    provider_id: 'arcade-google-news',
    toolkit_id: 'googlenews',
    name: 'Google News',
    icon: GoogleNews,
  },
  {
    provider_id: 'arcade-google-search',
    toolkit_id: 'googlesearch',
    name: 'Google Search',
    icon: GoogleSearch,
  },
  {
    provider_id: 'arcade-google-sheets',
    toolkit_id: 'googlesheets',
    name: 'Google Sheets',
    icon: GoogleSheets,
  },
  {
    provider_id: 'arcade-google-shopping',
    toolkit_id: 'googleshopping',
    name: 'Google Shopping',
    icon: GoogleShopping,
  },
  {
    provider_id: 'arcade-hubspot',
    toolkit_id: 'hubspot',
    name: 'HubSpot',
    icon: Hubspot,
  },
  {
    provider_id: 'arcade-jira',
    toolkit_id: 'jira',
    name: 'Jira',
    icon: Jira,
  },
  {
    provider_id: 'arcade-linear',
    toolkit_id: 'linear',
    name: 'Linear',
    icon: Linear,
  },
  {
    provider_id: 'arcade-microsoft',
    toolkit_id: 'microsoft',
    name: 'Microsoft',
    icon: Microsoft,
  },
  {
    provider_id: 'arcade-outlook-calendar',
    toolkit_id: 'outlookcalendar',
    name: 'Outlook Calendar',
    icon: OutlookCalendar,
  },
  {
    provider_id: 'arcade-outlook-mail',
    toolkit_id: 'outlookmail',
    name: 'Outlook Mail',
    icon: OutlookMail,
  },
  {
    provider_id: 'arcade-spotify',
    toolkit_id: 'spotify',
    name: 'Spotify',
    icon: Spotify,
  },
  {
    provider_id: 'arcade-stripe',
    toolkit_id: 'stripe',
    name: 'Stripe',
    icon: Stripe,
  },
  {
    provider_id: 'arcade-walmart',
    toolkit_id: 'walmart',
    name: 'Walmart',
    icon: Walmart,
  },
  {
    provider_id: 'arcade-youtube',
    toolkit_id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
  },
];

export const getAuthProviderByProviderId = (
  provider_id?: string,
): AuthProvider | undefined => {
  if (!provider_id) {
    return undefined;
  }

  return AuthProviders.find((provider) => provider.provider_id === provider_id);
};

export const getAuthProviderByToolkitId = (
  toolkit_id?: string,
): AuthProvider | undefined => {
  if (!toolkit_id) {
    return undefined;
  }

  const lowerCaseToolkitId = toolkit_id.toLowerCase();
  return AuthProviders.find(
    (provider) => provider.toolkit_id.toLowerCase() === lowerCaseToolkitId
  );
};
