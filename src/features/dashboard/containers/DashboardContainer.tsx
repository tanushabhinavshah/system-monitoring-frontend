import { useEffect, useState, useCallback } from 'react';
import { CpuChart } from '../components/CpuChart';
import { MemoryChart } from '../components/MemoryChart';
import { NetworkChart } from '../components/NetworkChart';
import { MetricCard } from '../components/MetricCard';
import { CpuAllocationCard } from '../components/CpuAllocationCard';
import { metricService } from '@/services/metricService';
import { alertService } from '@/services/alertService';
import { cpuService } from '@/services/cpuService';
import { formatTime } from '../utils/dashboardUtils';
import { MAX_DATA_POINTS, METRIC_LABELS } from '../constants/dashboardConstants';
import type { MetricData, ChartData, NetworkChartData, CpuAllocationData } from '../types/dashboardTypes';
import { toast } from 'sonner';

export const DashboardContainer = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [latestMetric, setLatestMetric] = useState<MetricData | null>(null);
  const [cpuAllocation, setCpuAllocation] = useState<CpuAllocationData | null>(null);
  const [isLoadingCpu, setIsLoadingCpu] = useState(false);

  const fetchCpuAllocation = useCallback(async () => {
    setIsLoadingCpu(true);
    try {
      const data = await cpuService.getCpuAllocation();
      setCpuAllocation(data);
    } catch (error) {
      console.error('Failed to fetch CPU allocation:', error);
    } finally {
      setIsLoadingCpu(false);
    }
  }, []);

  const handleNewMetric = useCallback((data: MetricData) => {
    setLatestMetric(data);
    setMetrics((prev) => {
      const updated = [...prev, data];
      if (updated.length > MAX_DATA_POINTS) {
        return updated.slice(-MAX_DATA_POINTS);
      }
      return updated;
    });
  }, []);

  // Initial fetch of CPU allocation
  useEffect(() => {
    fetchCpuAllocation();
  }, [fetchCpuAllocation]);

  useEffect(() => {
    const metricsCleanup = metricService.streamMetrics({
      onData: handleNewMetric,
      onError: (error) => {
        console.error('Metric stream error:', error);
      },
    });

    const alertsCleanup = alertService.streamAlerts({
      onAlert: (alert) => {
        // Show severity-based toast
        const toastFn = alert.severity === 'critical' ? toast.error : toast.warning;

        toastFn(`${alert.resource_type.toUpperCase()} Alert: ${alert.event_type}`, {
          description: alert.reason,
          duration: alert.severity === 'critical' ? 8000 : 5000,
          style: alert.severity === 'warning' ? {
            backgroundColor: '#fff7ed',
            color: '#c2410c',
            borderColor: '#ffedd5'
          } : undefined
        });

        // Trigger CPU allocation update if it's a CPU alert
        if (alert.resource_type === 'cpu') {
          fetchCpuAllocation();
        }
      },
      onError: (error) => {
        console.error('Alert stream error:', error);
        toast.error('Alert stream disconnected', {
          description: 'Attempting to reconnect...',
        });
      },
    });

    return () => {
      metricsCleanup();
      alertsCleanup();
    };
  }, [handleNewMetric, fetchCpuAllocation]);

  const cpuChartData: ChartData[] = metrics.map((m) => ({
    time: formatTime(m.timestamp),
    value: m.cpuUsagePercent,
  }));

  const memoryChartData: ChartData[] = metrics.map((m) => ({
    time: formatTime(m.timestamp),
    value: m.memoryUsagePercent,
  }));

  const networkChartData: NetworkChartData[] = metrics.map((m) => ({
    time: formatTime(m.timestamp),
    networkIn: m.networkInKb,
    networkOut: m.networkOutKb,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Real-time system resource monitoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={METRIC_LABELS.CPU}
          value={latestMetric?.cpuUsagePercent ?? 0}
          unit="%"
          type="cpu"
        />
        <MetricCard
          label={METRIC_LABELS.MEMORY}
          value={latestMetric?.memoryUsagePercent ?? 0}
          unit="%"
          type="memory"
        />
        <MetricCard
          label={METRIC_LABELS.NETWORK_IN}
          value={latestMetric?.networkInKb ?? 0}
          unit="KB"
          type="networkIn"
        />
        <MetricCard
          label={METRIC_LABELS.NETWORK_OUT}
          value={latestMetric?.networkOutKb ?? 0}
          unit="KB"
          type="networkOut"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CpuChart data={cpuChartData} />
        <MemoryChart data={memoryChartData} />
        <NetworkChart data={networkChartData} />
        <CpuAllocationCard data={cpuAllocation} loading={isLoadingCpu} />
      </div>
    </div>
  );
};
