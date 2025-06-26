import React from 'react';

interface ChartDataPoint {
  name: string;
  count: number;
}

interface CitationsChartProps {
  chartData: ChartDataPoint[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const CitationsChart: React.FC<CitationsChartProps> = ({ chartData }) => {
  // More robust validation
  const validChartData = chartData
    .filter(d => {
      const isValidName = typeof d.name === 'string' && d.name.trim().length > 0;
      const isValidCount = typeof d.count === 'number' && !isNaN(d.count) && isFinite(d.count) && d.count >= 0;
      const isValid = isValidName && isValidCount;
      if (!isValid) {
        console.warn('Invalid chart data point:', d, { isValidName, isValidCount });
      }
      return isValid;
    })
    .map(d => ({ 
      name: String(d.name).trim(), 
      count: Math.floor(Number(d.count)) // Ensure integer count
    }));
    
  if (validChartData.length < chartData.length) {
    console.warn('CitationsChart: Some chartData entries were invalid and filtered out. Original:', chartData, 'Valid:', validChartData);
  }

  if (validChartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
        <p>Ask some questions to see citation data populate here.</p>
      </div>
    );
  }

  // Additional safety check - ensure all values are truly safe
  const safeData = validChartData.map((item, index) => ({
    name: `${item.name}`.substring(0, 50), // Limit length
    count: Math.max(0, Math.floor(item.count || 0)), // Ensure positive integer
    index // Add index for unique keys
  }));

  // Calculate max count for bar width scaling
  const maxCount = Math.max(...safeData.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          Citations for This Answer
        </h2>
        <p className="text-sm text-gray-600 mt-1">Documents referenced in the latest response.</p>
      </div>
      
      {/* Chart Content */}
      <div className="p-6">
        <div className="space-y-4">
          {safeData.slice(0, 8).map((item, index) => (
            <div key={index} className="group hover:bg-gray-50 p-3 rounded-lg transition-all duration-200">
              {/* Document name and count header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-800 text-sm truncate max-w-[200px]" title={item.name}>
                    {item.name.replace('.pdf', '')}
                  </span>
                </div>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold min-w-[2rem] text-center">
                  {item.count}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ 
                      width: `${Math.max((item.count / maxCount) * 100, 5)}%`,
                      background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Percentage text */}
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {Math.round((item.count / maxCount) * 100)}% of max
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {safeData.length > 8 && (
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              +{safeData.length - 8} more documents
            </span>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Citations update in real-time
          </span>
          <span>Total: {safeData.reduce((sum, item) => sum + item.count, 0)} citations</span>
        </div>
      </div>
    </div>
  );
};

export default CitationsChart;
