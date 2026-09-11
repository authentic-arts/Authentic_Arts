import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ksh, toKsh, USD_TO_KSH } from '../utils/currency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const { user, artworks, withdrawWallet } = useAuth();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mpesa');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawEmail, setWithdrawEmail] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [salesAnalytics, setSalesAnalytics] = useState([]);

  // Fetch sales analytics from Supabase for this artist
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('sales_analytics')
      .select('month, month_num, sales, revenue')
      .eq('artist_id', user.id)
      .eq('year', new Date().getFullYear())
      .order('month_num', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error('salesAnalytics:', error.message); return; }
        setSalesAnalytics(data || []);
      });
  }, [user?.id]);

  if (!user || (user.role !== 'artist' && user.role !== 'admin')) {
    navigate('/profile');
    return null;
  }

  // Get artist's artworks
  const myArtworks = artworks.filter((a) => a.artistId === user.id);

  // Use live data; fall back to empty months if none yet
  const DEFAULT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    .map((m, i) => ({ month: m, month_num: i + 1, sales: 0, revenue: 0 }));

  const mySalesData = {
    monthly: salesAnalytics.length > 0 ? salesAnalytics : DEFAULT_MONTHS,
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawMsg('');

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }

    // walletBalance from DB is in USD; convert user input (KSH) to USD for comparison
    const amtUsd = amt / USD_TO_KSH;
    if (amtUsd > (user.walletBalance || 0)) {
      setWithdrawError(`Amount exceeds available wallet balance (${ksh(toKsh(user.walletBalance || 0, 'USD'))}).`);
      return;
    }

    if (withdrawMethod === 'mpesa' && !withdrawPhone.trim()) {
      setWithdrawError('Please enter your M-Pesa phone number.');
      return;
    }

    if (withdrawMethod === 'paypal' && !withdrawEmail.trim()) {
      setWithdrawError('Please enter your PayPal email.');
      return;
    }

    const destination = withdrawMethod === 'mpesa' ? withdrawPhone : withdrawEmail;
    const res = await withdrawWallet(amtUsd, withdrawMethod, destination);
    if (res.success) {
      setWithdrawMsg(`Successfully requested withdrawal of ${ksh(amt)} via ${
        withdrawMethod === 'mpesa' ? `M-Pesa (${withdrawPhone})` : `PayPal (${withdrawEmail})`
      }. Commission and processing checks approved!`);
      setWithdrawAmount('');
      setWithdrawPhone('');
      setWithdrawEmail('');
    } else {
      setWithdrawError(res.error || 'Failed to complete withdrawal.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Artist Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your works, wallet, and analyze sales performance.</p>
          </div>
          <Link
            to="/artist/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-blue-500/10"
          >
            + Upload New Art
          </Link>
        </div>

        {/* Wallet & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-500 text-white rounded-2xl p-6 shadow-md space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-85">Wallet Balance</p>
            <p className="text-3xl font-bold">{ksh(toKsh(user.walletBalance || 0, 'USD'))}</p>
            <p className="text-xs opacity-75">15% commission already deducted</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{ksh(toKsh(user.totalEarnings || 0, 'USD'))}</p>
            <p className="text-xs text-gray-500">Gross platform sales share</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Withdrawn</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{ksh(toKsh(user.withdrawn || 0, 'USD'))}</p>
            <p className="text-xs text-green-500">Paid out to PayPal / M-Pesa</p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Sales Count</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{user.totalSales || 0}</p>
            <p className="text-xs text-gray-500">Items sold so far</p>
          </div>
        </div>

        {/* Charts & Withdrawal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sales chart */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Performance (Monthly)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mySalesData.monthly}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [ksh(value), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Withdrawal Prompt */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Request Cashout</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Withdraw earnings directly to Lipa Na M-Pesa or PayPal.</p>
              
              {withdrawError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-2.5 rounded-xl text-center text-xs mb-3">
                  {withdrawError}
                </div>
              )}

              {withdrawMsg && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-2.5 rounded-xl text-center text-xs mb-3">
                  {withdrawMsg}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Amount (KSH)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Min KSh 1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Method</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('mpesa')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        withdrawMethod === 'mpesa'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('paypal')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        withdrawMethod === 'paypal'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      PayPal
                    </button>
                  </div>
                </div>

                {withdrawMethod === 'mpesa' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">PayPal Email</label>
                    <input
                      type="email"
                      placeholder="paypal@example.com"
                      value={withdrawEmail}
                      onChange={(e) => setWithdrawEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-md mt-2"
                >
                  Withdraw Balance
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Artworks List */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Uploaded Artworks</h2>
          {myArtworks.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🎨</span>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">You haven't uploaded any artworks yet.</p>
              <Link to="/artist/upload" className="text-blue-500 hover:underline text-sm font-semibold mt-4 inline-block">
                Upload your first piece →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Artwork</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Qty Limit</th>
                    <th className="py-3 px-4">Sold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {myArtworks.map((art) => (
                    <tr key={art.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img src={art.image} alt={art.title} className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-gray-800" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{art.title}</p>
                          <p className="text-xs text-gray-400 capitalize">{art.category}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold">{ksh(art.price)}</td>
                      <td className="py-4 px-4">{art.quantity} pcs</td>
                      <td className="py-4 px-4 font-medium text-green-600 dark:text-green-400">{art.sales || 0} sold</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          art.status === 'available'
                            ? 'bg-green-50 text-green-700 border border-green-150'
                            : art.status === 'sold'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-orange-50 text-orange-700 border border-orange-150'
                        }`}>
                          {art.status === 'available' ? 'approved' : art.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {art.reviewCount > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span className="font-semibold">{art.averageRating}</span>
                            <span className="text-xs text-gray-400">({art.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No reviews</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Link to={`/artwork/${art.id}`} className="text-blue-500 hover:text-blue-600 font-semibold text-xs">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
