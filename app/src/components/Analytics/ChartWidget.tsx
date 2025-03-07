import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { FaCog, FaExpand, FaDownload } from 'react-icons/fa';
import ChartSettingsModal from './ChartSettingsModal';

// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

interface DataPoint {
  x: string | number;
  y: number;
}

interface DataSet {
  label: string;
  data: DataPoint[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter';
  title: string;
  datasets: DataSet[];
  options?: any;
}

interface ChartWidgetProps {
  config: ChartConfig;
  widgetId: string;
  onConfigChange?: (widgetId: string, newConfig: ChartConfig) => void;
  width?: string | number;
  height?: string | number;
  isResizable?: boolean;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({
  config,
  widgetId,
  onConfigChange,
  width = '100%',
  height = 400,
  isResizable = true,
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Инициализация и обновление графика
  useEffect(() => {
    if (chartRef.current) {
      // Очищаем предыдущий экземпляр графика
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Создаем новый график
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: config.type,
          data: {
            labels: config.datasets[0]?.data.map(item => item.x) || [],
            datasets: config.datasets.map(dataset => ({
              label: dataset.label,
              data: dataset.data.map(item => item.y),
              backgroundColor: dataset.backgroundColor || generateRandomColors(dataset.data.length),
              borderColor: dataset.borderColor || (config.type === 'line' ? '#4C51BF' : undefined),
              borderWidth: dataset.borderWidth || 1,
              fill: dataset.fill !== undefined ? dataset.fill : config.type === 'line',
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: config.title,
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              legend: {
                display: true,
                position: 'top',
              },
              tooltip: {
                enabled: true,
              },
            },
            ...config.options,
          },
        });
      }
    }

    // Очищаем при размонтировании
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [config]);

  // Обработчик изменения настроек графика
  const handleConfigChange = (newConfig: ChartConfig) => {
    if (onConfigChange) {
      onConfigChange(widgetId, newConfig);
    }
    setIsSettingsOpen(false);
  };

  // Экспорт графика как изображения
  const handleExportChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${config.title.replace(/\s+/g, '_')}_chart.png`;
      link.href = url;
      link.click();
    }
  };

  // Переключение полноэкранного режима
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Генерация случайных цветов
  const generateRandomColors = (count: number) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137) % 360; // Золотое сечение для хорошего распределения цветов
      colors.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    return colors;
  };

  return (
    <div
      className={`chart-widget ${isFullscreen ? 'fullscreen' : ''}`}
      style={{
        width: isFullscreen ? '100vw' : width,
        height: isFullscreen ? '100vh' : height,
      }}
    >
      <div className="chart-widget-header">
        <h3>{config.title}</h3>
        <div className="chart-controls">
          <button
            className="chart-control-button"
            onClick={() => setIsSettingsOpen(true)}
            title="Настройки"
          >
            <FaCog />
          </button>
          <button
            className="chart-control-button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          >
            <FaExpand />
          </button>
          <button
            className="chart-control-button"
            onClick={handleExportChart}
            title="Скачать как изображение"
          >
            <FaDownload />
          </button>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={chartRef} />
      </div>

      {isSettingsOpen && (
        <ChartSettingsModal
          config={config}
          onSave={handleConfigChange}
          onCancel={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChartWidget;
