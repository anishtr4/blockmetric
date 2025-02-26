import axios from 'axios';
import { store } from '../store/store';

// Analytics Data Interfaces
interface AnalyticsData {
  uniqueVisitors: number;
  visitorChange: string;
  averageSessionDuration: string;
  sessionDurationChange: string;
  bounceRate: number;
  bounceRateChange: string;
  pageViews: number;
  pageViewsChange: string;
  visitorsByTime: VisitorTimeData[];
  topPages: PageData[];
  deviceStats: DeviceData[];
  browserStats: BrowserData[];
  osStats: OSData[];
  userActivity: ActivityData[];
}

interface VisitorTimeData {
  time: string;
  visitors: number;
}

interface PageData {
  page: string;
  views: number;
  change: string;
  avgTime: string;
  avgTimeChange?: string;
}

interface DeviceData {
  type: string;
  percentage: number;
}

interface BrowserData {
  name: string;
  percentage: number;
}

interface OSData {
  name: string;
  percentage: number;
}

interface ActivityData {
  time: string;
  location: string;
  action: string;
  page: string;
  type: 'page_view' | 'click' | 'form_submit' | 'custom' | string;
  formatted_time: string;
}

interface UserMetrics {
  mau: number;
  dau: number;
  hau: number;
  mauChange: string;
  dauChange: string;
  hauChange: string;
}

export const fetchUserMetrics = async (): Promise<UserMetrics> => {
  const state = store.getState();
  const apiKey = state.website.selectedWebsite?.value;

  if (!apiKey) {
    throw new Error('No website selected or API key not found');
  }

  const response = await axios.get('/api/analytics/user-metrics', {
    headers: {
      'x-api-key': apiKey
    }
  });
  return response.data;
};

export const fetchAnalyticsData = async (): Promise<AnalyticsData> => {
  const state = store.getState();
  const apiKey = state.website.selectedWebsite?.value;

  if (!apiKey) {
    throw new Error('No website selected or API key not found');
  }

  const response = await axios.get('/api/analytics/dashboard-metrics', {
    headers: {
      'x-api-key': apiKey
    }
  });
  return response.data;
};

export const fetchVisitorDemographics = async () => {
  const state = store.getState();
  const apiKey = state.website.selectedWebsite?.value;

  if (!apiKey) {
    throw new Error('No website selected or API key not found');
  }

  const response = await axios.get('/api/analytics/demographics', {
    headers: {
      'x-api-key': apiKey
    }
  });
  return response.data;
};

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const fetchVisitorTrends = async (timeRange: TimeRange = 'daily'): Promise<VisitorTimeData[]> => {
  const state = store.getState();
  const apiKey = state.website.selectedWebsite?.value;

  if (!apiKey) {
    throw new Error('No website selected or API key not found');
  }

  const response = await axios.get('/api/analytics/visitor-trends', {
    params: {
      timeRange
    },
    headers: {
      'x-api-key': apiKey
    }
  });
  return response.data;
};