//AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // profile row
  const [session, setSession]   = useState(null);   // supabase session
  const [users, setUsers]       = useState([]);     // all profiles (admin CRM)
  const [artworks, setArtworks] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);

  // ----------------------------------------------------------
  // Fetch the profile row for a given auth user id
  // ----------------------------------------------------------
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) { console.error('fetchProfile:', error.message); return null; }
    return data;
  }, []);

  // ----------------------------------------------------------
  // Fetch all public data (artworks + reviews) on mount
  // ----------------------------------------------------------
  const fetchArtworks = useCallback(async () => {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('fetchArtworks:', error.message); return; }
    setArtworks(data || []);
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('fetchReviews:', error.message); return; }
    setReviews(data || []);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('join_date', { ascending: false });
    if (error) { console.error('fetchAllUsers:', error.message); return; }
    setUsers(data || []);
  }, []);

  // ----------------------------------------------------------
  // Bootstrap: listen to Supabase auth state changes
  // ----------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    // 🛑 SAFETY NET: Force loading to false after 3 seconds if auth hangs
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    const syncUser = async (currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        try {
          const profile = await fetchProfile(currentSession.user.id);
          if (mounted) setUser(profile);
        } catch (err) {
          console.error('Profile sync error:', err);
        }
      } else {
        if (mounted) setUser(null);
      }
      if (mounted) setLoading(false);
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (mounted) syncUser(s);
    }).catch((err) => {
      console.error('getSession error:', err);
      if (mounted) setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (mounted) syncUser(s);
      }
    );

    // Fetch public content
    fetchArtworks();
    fetchReviews();

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchArtworks, fetchReviews]);

  // Fetch all users whenever an admin logs in
  useEffect(() => {
    if (user?.role === 'admin') fetchAllUsers();
  }, [user?.role, fetchAllUsers]);

  // ----------------------------------------------------------
  // AUTH: signIn  (returns { success, error })
  // ----------------------------------------------------------
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    const profile = await fetchProfile(data.user.id);
    setUser(profile);
    return { success: true, user: profile };
  };

  // ----------------------------------------------------------
  // AUTH: signUp  (returns { success, error })
  // userData = { name, email, password, location, preferredStyles }
  // ----------------------------------------------------------
  const signUp = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: 'customer',
        },
      },
    });
    if (error) return { success: false, error: error.message };

    // Trigger creates the profile row automatically.
    // We safely use upsert to blend metadata fields seamlessly with the database trigger.
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:               data.user.id,
        email:            userData.email,
        name:             userData.name,
        role:             'customer',
        location:         userData.location  || null,
        preferred_styles: userData.preferredStyles || [],
      }, { onConflict: 'id' });

      const profile = await fetchProfile(data.user.id);
      setUser(profile);
    }

    return { success: true };
  };

  // ----------------------------------------------------------
  // AUTH: signOut
  // ----------------------------------------------------------
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // ----------------------------------------------------------
  // PROFILE: updateUser
  // ----------------------------------------------------------
  const updateUser = async (updates) => {
    if (!user) return;
    // Map camelCase keys from the old API → snake_case DB columns
    const dbUpdates = {};
    if (updates.name            !== undefined) dbUpdates.name             = updates.name;
    if (updates.email           !== undefined) dbUpdates.email            = updates.email;
    if (updates.location        !== undefined) dbUpdates.location         = updates.location;
    if (updates.preferredStyles !== undefined) dbUpdates.preferred_styles = updates.preferredStyles;
    if (updates.bio             !== undefined) dbUpdates.bio              = updates.bio;
    if (updates.avatar_url      !== undefined) dbUpdates.avatar_url       = updates.avatar_url;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) { console.error('updateUser:', error.message); return; }
    setUser(data);
    // Keep the users list in sync for admin CRM
    setUsers(prev => prev.map(u => u.id === data.id ? data : u));
  };

  // ----------------------------------------------------------
  // PROFILE: switchToArtist  (calls DB RPC)
  // ----------------------------------------------------------
  const switchToArtist = async () => {
    const { error } = await supabase.rpc('fn_switch_to_artist', {
      p_bio:      user.bio      || '',
      p_location: user.location || '',
    });
    if (error) { console.error('switchToArtist:', error.message); return; }
    const profile = await fetchProfile(user.id);
    setUser(profile);
  };

  // ----------------------------------------------------------
  // ARTWORKS: addArtwork  (artist uploads a new piece)
  // ----------------------------------------------------------
  const addArtwork = async (artworkData) => {
    const payload = {
      artist_id:    user.id,
      artist_name:  user.name,
      title:        artworkData.title,
      description:  artworkData.description,
      category:     artworkData.category,
      style:        artworkData.style,
      medium:       artworkData.medium        || null,
      dimensions:   artworkData.dimensions    || null,
      year:         artworkData.year          || new Date().getFullYear(),
      origin:       artworkData.origin,
      authenticity: artworkData.authenticity,
      inspiration:  artworkData.inspiration   || null,
      tags:         artworkData.tags          || [],
      price:        artworkData.price,
      original_price: artworkData.price,
      quantity:     artworkData.quantity,
      images:       artworkData.image ? [artworkData.image] : [],
      status:       'pending',
    };

    const { data, error } = await supabase
      .from('artworks')
      .insert(payload)
      .select()
      .single();

    if (error) { console.error('addArtwork:', error.message); return null; }

    // Increment artist portfolio_total_works
    await supabase.from('profiles').update({
      portfolio_total_works: (user.portfolio_total_works || 0) + 1,
    }).eq('id', user.id);

    const updatedProfile = await fetchProfile(user.id);
    setUser(updatedProfile);

    setArtworks(prev => [data, ...prev]);
    return data;
  };

  // ----------------------------------------------------------
  // ARTWORKS: approveArtwork  (admin)
  // ----------------------------------------------------------
  const approveArtwork = async (artworkId) => {
    const { error } = await supabase.rpc('fn_approve_artwork', { p_artwork_id: artworkId });
    if (error) { console.error('approveArtwork:', error.message); return; }
    setArtworks(prev => prev.map(a =>
      a.id === artworkId ? { ...a, status: 'available' } : a
    ));
    fetchAllUsers(); // refresh artist portfolio stats in CRM
  };

  // ----------------------------------------------------------
  // ARTWORKS: rejectArtwork  (admin)
  // ----------------------------------------------------------
  const rejectArtwork = async (artworkId) => {
    const { error } = await supabase.rpc('fn_reject_artwork', { p_artwork_id: artworkId });
    if (error) { console.error('rejectArtwork:', error.message); return; }
    setArtworks(prev => prev.filter(a => a.id !== artworkId));
  };

  // ----------------------------------------------------------
  // REVIEWS: addReview
  // ----------------------------------------------------------
  const addReview = async (reviewData) => {
    const payload = {
      artwork_id:  reviewData.artworkId,
      user_id:     user.id,
      user_name:   user.name,
      user_avatar: user.avatar_url,
      rating:      reviewData.rating,
      comment:     reviewData.comment,
      verified:    true,
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(payload)
      .select()
      .single();

    if (error) { console.error('addReview:', error.message); return null; }

    setReviews(prev => [data, ...prev]);
    // Refresh the artwork so its average_rating is up to date
    await fetchArtworks();
    return data;
  };

  // ----------------------------------------------------------
  // ORDERS: markPurchased  (called after payment succeeds)
  // cartItems = [{ id, price, quantity, artistId, ... }]
  // ----------------------------------------------------------
  const markPurchased = async (cartItems, { paymentMethod = 'mpesa', paymentRef = null } = {}) => {
    const wasFirstTime = user?.is_first_time_buyer;
    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = wasFirstTime ? subtotal * 0.2 : 0;
    const total    = subtotal - discount;

    // 1. Create the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id:                 user.id,
        status:                      'confirmed',
        payment_method:              paymentMethod,
        payment_ref:                 paymentRef,
        subtotal,
        discount_amount:             discount,
        total,
        first_time_discount_applied: wasFirstTime,
      })
      .select()
      .single();

    if (orderErr) { console.error('markPurchased (order):', orderErr.message); return wasFirstTime; }

    // 2. Link transaction if M-Pesa receipt or checkout ID
    if (paymentRef) {
      try {
        await supabase
          .from('mpesa_transactions')
          .update({ order_id: order.id })
          .or(`mpesa_receipt_number.eq.${paymentRef},checkout_request_id.eq.${paymentRef}`);
      } catch (linkErr) {
        console.warn('Could not link mpesa transaction to order:', linkErr);
      }
    }

    // 3. Insert order items
    const items = cartItems.map(item => ({
      order_id:      order.id,
      artwork_id:    item.id,
      artist_id:     item.artist_id || item.artistId,
      unit_price:    item.price,
      quantity:      item.quantity,
      subtotal:      item.price * item.quantity,
      artist_credit: item.price * item.quantity * 0.85,
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(items);
    if (itemsErr) { console.error('markPurchased (items):', itemsErr.message); return wasFirstTime; }

    // 4. Run the DB processing function (stock, wallets, analytics)
    const { error: procErr } = await supabase.rpc('fn_process_order', { p_order_id: order.id });
    if (procErr) { console.error('markPurchased (process):', procErr.message); }

    // 5. Refresh local state
    await fetchArtworks();
    const updatedProfile = await fetchProfile(user.id);
    setUser(updatedProfile);

    return wasFirstTime;
  };

  // ----------------------------------------------------------
  // hasPurchased – check purchased_artworks table
  // ----------------------------------------------------------
  const hasPurchased = async (artworkId) => {
    if (!user) return false;
    const { data } = await supabase
      .from('purchased_artworks')
      .select('artwork_id')
      .eq('customer_id', user.id)
      .eq('artwork_id', artworkId)
      .maybeSingle();
    return !!data;
  };

  // ----------------------------------------------------------
  // WALLET: withdrawWallet  (calls DB RPC)
  // ----------------------------------------------------------
  const withdrawWallet = async (amount, method, destination) => {
    const { error } = await supabase.rpc('fn_request_withdrawal', {
      p_amount:      amount,
      p_method:      method,
      p_destination: destination,
    });
    if (error) return { success: false, error: error.message };
    const updatedProfile = await fetchProfile(user.id);
    setUser(updatedProfile);
    return { success: true };
  };

  // ----------------------------------------------------------
  // Normalise a raw Supabase artwork row → camelCase shape
  // ----------------------------------------------------------
  const normaliseArtwork = (a) => ({
    ...a,
    artistId:      a.artist_id,
    artistName:    a.artist_name,
    altText:       a.alt_text,
    originalPrice: a.original_price,
    bestSeller:    a.best_seller,
    averageRating: a.average_rating,
    reviewCount:   a.review_count,
    createdAt:     a.created_at,
    updatedAt:     a.updated_at,
    image:         a.images?.[0] || null,
  });

  // ----------------------------------------------------------
  // Normalise a raw Supabase review row → camelCase shape
  // ----------------------------------------------------------
  const normaliseReview = (r) => ({
    ...r,
    artworkId:  r.artwork_id,
    userId:     r.user_id,
    userName:   r.user_name,
    userAvatar: r.user_avatar,
    date:       r.created_at?.split('T')[0],
  });

  // ----------------------------------------------------------
  // Normalise profile fields to camelCase for backward compat
  // ----------------------------------------------------------
  const normalisedUser = user ? {
    ...user,
    avatarUrl:        user.avatar_url,
    joinDate:         user.join_date,
    preferredStyles:  user.preferred_styles,
    isFirstTimeBuyer: user.is_first_time_buyer,
    walletBalance:    user.wallet_balance,
    totalEarnings:    user.total_earnings,
    totalSales:       user.total_sales,
    portfolioStats: {
      totalWorks: user.portfolio_total_works,
      sold:       user.portfolio_sold,
      available:  user.portfolio_available,
    },
    avatar: user.avatar_url,
  } : null;

  return (
    <AuthContext.Provider value={{
      user: normalisedUser,
      session,
      users,
      artworks: artworks.map(normaliseArtwork),
      reviews:  reviews.map(normaliseReview),
      loading,
      signIn,
      signUp,
      signOut,
      updateUser,
      switchToArtist,
      addArtwork,
      addReview,
      markPurchased,
      hasPurchased,
      withdrawWallet,
      approveArtwork,
      rejectArtwork,
      fetchArtworks,
      fetchAllUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}