import apiClient from './apiClient';
import { USE_MOCK_API, API_ENDPOINTS, MOCK_DELAY_MS } from '@/config/apiConfig';
import { generateMockMetric } from '@/features/dashboard/utils/dashboardUtils';
import type { MetricData } from '@/features/dashboard/types/dashboardTypes';

// For mock mode, we'll use a generator function
let mockIntervalId: NodeJS.Timeout | null = null;

export interface MetricStreamCallbacks {
  onData: (data: MetricData) => void;
  onError: (error: Error) => void;
}

// Mock SSE implementation using setInterval
const mockStreamMetrics = (callbacks: MetricStreamCallbacks): (() => void) => {
  mockIntervalId = setInterval(() => {
    try {
      const metric = generateMockMetric();
      callbacks.onData(metric);
    } catch (error) {
      callbacks.onError(error as Error);
    }
  }, 2500);

  // Return cleanup function
  return () => {
    if (mockIntervalId) {
      clearInterval(mockIntervalId);
      mockIntervalId = null;
    }
  };
};

// Real SSE implementation
const realStreamMetrics = (callbacks: MetricStreamCallbacks): (() => void) => {
  const eventSource = new EventSource(
    `${apiClient.defaults.baseURL}${API_ENDPOINTS.METRICS.STREAM}`
  );

  const handleMetricUpdate = (event: MessageEvent) => {
    try {
      const rawData = JSON.parse(event.data);
      const mappedData: MetricData = {
        timestamp: new Date(rawData.timestamp).getTime(),
        cpuUsagePercent: rawData.cpu_usage_percent,
        memoryUsagePercent: rawData.memory_usage_percent,
        networkInKb: rawData.network_in_kb,
        networkOutKb: rawData.network_out_kb,
      };
      callbacks.onData(mappedData);
    } catch (error) {
      callbacks.onError(new Error('Failed to parse metric data'));
    }
  };

  eventSource.addEventListener('metric_update', handleMetricUpdate as EventListener);

  eventSource.onerror = () => {
    callbacks.onError(new Error('SSE connection error'));
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    eventSource.removeEventListener('metric_update', handleMetricUpdate as EventListener);
    eventSource.close();
  };
};

export const metricService = {
  streamMetrics: USE_MOCK_API ? mockStreamMetrics : realStreamMetrics,
};
