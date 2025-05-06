import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVenueById } from '../../hooks/useVenueById';

const ManagerAnalytics: React.FC = () => {
  const { userProfile } = useAuth();
  const venueId = userProfile?.venue_id || undefined;
  const { data: venue, isLoading } = useVenueById(venueId);

  // Mock data - will be replaced with actual API calls
  const analyticsData = {
    todaySales: 450.75,
    weekSales: 3245.50,
    monthSales: 12650.25,
    topProducts: [
      { name: 'Espresso', count: 128, revenue: 320.00 },
      { name: 'Cappuccino', count: 95, revenue: 304.00 },
      { name: 'Croissant', count: 87, revenue: 243.60 },
      { name: 'Latte', count: 76, revenue: 258.40 },
      { name: 'Sandwich', count: 45, revenue: 225.00 },
    ],
    peakHours: [
      { hour: '8-9', customers: 45 },
      { hour: '9-10', customers: 62 },
      { hour: '12-13', customers: 78 },
      { hour: '13-14', customers: 84 },
      { hour: '17-18', customers: 56 },
    ]
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      {!venueId && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">No Venue Assigned</h2>
          <p>You need to be assigned to a venue to view analytics. Please contact an administrator.</p>
        </div>
      )}

      {isLoading && venueId && (
        <p>Loading venue information...</p>
      )}

      {venue && venueId && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-3">{venue.name} Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
                <p className="text-2xl font-bold text-indigo-600">€{analyticsData.todaySales.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                <p className="text-2xl font-bold text-indigo-600">€{analyticsData.weekSales.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">This Month</h3>
                <p className="text-2xl font-bold text-indigo-600">€{analyticsData.monthSales.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-3">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.topProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{product.count}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">€{product.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-3">Peak Hours</h3>
              <div className="h-64 flex items-end justify-between px-2">
                {analyticsData.peakHours.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 bg-indigo-500 rounded-t"
                      style={{ height: `${(data.customers / 100) * 200}px` }}
                    ></div>
                    <p className="text-xs text-gray-600 mt-1">{data.hour}</p>
                    <p className="text-xs font-semibold">{data.customers}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-700">
              Note: This is a mock implementation. In the real application, this will be connected to actual sales data from the database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerAnalytics; 