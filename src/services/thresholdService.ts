import apiClient from './apiClient';
import { USE_MOCK_API, API_ENDPOINTS, MOCK_DELAY_MS } from '@/config/apiConfig';
import type { ThresholdData, ThresholdResponse } from '@/features/thresholds/types/thresholdTypes';
import { DEFAULT_THRESHOLDS } from '@/features/thresholds/constants/thresholdConstants';

// Mock storage
let mockThresholds: ThresholdData = { ...DEFAULT_THRESHOLDS };

// Mock implementations
const mockGetThresholds = async (): Promise<ThresholdData> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return { ...mockThresholds };
};

const mockUpdateThresholds = async (data: ThresholdData): Promise<ThresholdResponse> => {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  mockThresholds = { ...data };
  return { message: 'Thresholds updated successfully' };
};

// Real API implementations
const realGetThresholds = async (): Promise<ThresholdData> => {
  const response = await apiClient.get<ThresholdData>(API_ENDPOINTS.THRESHOLDS.GET);
  return response.data;
};

const realUpdateThresholds = async (data: ThresholdData): Promise<ThresholdResponse> => {
  const response = await apiClient.patch<ThresholdResponse>(API_ENDPOINTS.THRESHOLDS.UPDATE, data);
  return response.data;
};

export const thresholdService = {
  getThresholds: USE_MOCK_API ? mockGetThresholds : realGetThresholds,
  updateThresholds: USE_MOCK_API ? mockUpdateThresholds : realUpdateThresholds,
};
