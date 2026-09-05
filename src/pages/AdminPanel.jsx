import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, users, artworks, approveArtwork, rejectArtwork } = useAuth();
  const [activeTab, setActiveTab] = useState('curation');
  const [adminMsg, setAdminMsg] = useState('');

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Artworks pending curation review
  const pendingArtworks = artworks.filter((a) => a.status === 'pending');

  const handleApprove = (id, title) => {
    approveArtwork(id);
    setAdminMsg(`Artwork "${title}" approved and published to collections successfully!`);
    setTimeout(() => setAdminMsg(''), 4000);
  };

  const handleReject = (id, title) => {
    if (window.confirm(`Are you sure you want to reject and remove "${title}"?`)) {
      rejectArtwork(id);
      setAdminMsg(`Artwork "${title}" rejected and removed from review queue.`);
      setTimeout(() => setAdminMsg(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Curator Admin Control Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform management, verification workflow, and user CRM database.</p>
        </div>

        {adminMsg && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 p-4 rounded-xl text-center text-sm font-semibold">
            {adminMsg}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('curation')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'curation'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Art Curation Queue ({pendingArtworks.length})
          </button>
          
          <button
            onClick={() => setActiveTab('crm')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'crm'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            User Database CRM ({users.length})
          </button>
        </div>

        {/* Curation Queue Tab */}
        {activeTab === 'curation' && (
          <div className="space-y-6">
            {pendingArtworks.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-sm">
                <span className="text-4xl">✅</span>
                <p className="text-gray-500 dark:text-gray-400 mt-4 text-base">Curation queue is completely clear. No pending approvals.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{art.title}</h3>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">${art.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Uploaded by artist: {art.artistName} (ID: {art.artistId})</p>
                        
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <p>🎨 <strong className="text-gray-800 dark:text-white">Style/Category:</strong> {art.category} · {art.style}</p>
                          <p>📦 <strong className="text-gray-800 dark:text-white">Quantity limit:</strong> {art.quantity} pieces</p>
                          <p>📍 <strong className="text-gray-800 dark:text-white">Origin:</strong> {art.origin}</p>
                          <p>📜 <strong className="text-gray-800 dark:text-white">Authenticity:</strong> {art.authenticity}</p>
                          {art.inspiration && <p>💡 <strong className="text-gray-800 dark:text-white">Inspiration:</strong> {art.inspiration}</p>}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleReject(art.id, art.title)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-650 text-xs font-semibold py-2.5 rounded-xl border border-red-150 transition-colors text-center"
                        >
                          Reject Submission
                        </button>
                        <button
                          onClick={() => handleApprove(art.id, art.title)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors shadow-md shadow-blue-500/10 text-center"
                        >
                          Verify & Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Database CRM Tab */}
        {activeTab === 'crm' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Platform Stats / History</th>
                    <th className="py-3 px-4">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/50 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-800" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : u.role === 'artist'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">{u.location || 'N/A'}</td>
                      <td className="py-4 px-4">
                        {u.role === 'artist' ? (
                          <div className="text-xs space-y-0.5">
                            <p>💼 <span className="font-semibold text-gray-900 dark:text-white">Wallet:</span> ${u.walletBalance?.toFixed(2)}</p>
                            <p>📈 <span className="font-semibold text-gray-900 dark:text-white">Earnings:</span> ${u.totalEarnings?.toFixed(2)}</p>
                            <p>📦 <span className="font-semibold text-gray-900 dark:text-white">Works:</span> {u.portfolioStats?.totalWorks} ({u.portfolioStats?.sold} sold)</p>
                          </div>
                        ) : u.role === 'customer' ? (
                          <div className="text-xs space-y-0.5">
                            <p>🛍️ <span className="font-semibold text-gray-900 dark:text-white">Purchased:</span> {u.purchasedArtworks?.length} artworks</p>
                            <p>🎟️ <span className="font-semibold text-gray-900 dark:text-white">First Buyer Promo:</span> {u.isFirstTimeBuyer ? 'Unused' : 'Used'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Platform administrator</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-450">{u.joinDate || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
