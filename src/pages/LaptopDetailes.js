import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ApiService from '../services/apiService';
import AuthService from '../services/authService';

export default function LaptopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [laptop, setLaptop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review UI state
  const [canReview, setCanReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [form, setForm] = useState({ rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const userInfo = AuthService.getUserInfo();

  const ratingValid = useMemo(() => form.rating >= 1 && form.rating <= 5, [form.rating]);
  const commentValid = useMemo(() => (form.comment || '').trim().length >= 10, [form.comment]);
  const isLoggedIn = !!AuthService.getToken();
  const avgRating = useMemo(() => {
    const nums = (reviews || []).map(r => Number(r.rating) || 0);
    if (!nums.length) return 0;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10; // 1 decimal
  }, [reviews]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [lp, revs] = await Promise.all([
          ApiService.getLaptopById(id),
          ApiService.getLaptopReviews(id)
        ]);
        setLaptop(lp);
        setReviews(revs || []);

        // Detect my review
        const me = userInfo?.userID || userInfo?.id || userInfo?.userId;
        const mine = (revs || []).find(r => (r?.user?.userID || r?.user?.id) === me);
        setMyReview(mine || null);

        // Check review eligibility using the centralized API method
        if (isLoggedIn) {
          try {
            // Get order information for display purposes
            const myOrders = await ApiService.getMyOrders();
            const forThisLaptop = (myOrders || []).filter(o => (o?.laptop?.laptopID || o?.laptop?.id) === Number(id));
            const purchased = forThisLaptop.length > 0;
            const delivered = forThisLaptop.some(o => o?.status === 'DELIVERED');
            setHasPurchased(purchased);
            setIsDelivered(delivered);
            
            // Use the centralized API method to check review eligibility
            // This will handle both delivery status and duplicate review prevention
            const eligibilityResponse = await ApiService.canUserReview(Number(id));
            setCanReview(eligibilityResponse.canReview);
          } catch (e) {
            setHasPurchased(false);
            setIsDelivered(false);
            setCanReview(false);
          }
        } else {
          setHasPurchased(false);
          setIsDelivered(false);
          setCanReview(false);
        }
      } catch (e) {
        setError(e.message || 'Failed to load laptop');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refreshReviews = async () => {
    try {
      const revs = await ApiService.getLaptopReviews(id);
      setReviews(revs || []);
      const me = userInfo?.userID || userInfo?.id || userInfo?.userId;
      const mine = (revs || []).find(r => (r?.user?.userID || r?.user?.id) === me);
      setMyReview(mine || null);
      
      // Also refresh review eligibility after reviews are updated
      if (isLoggedIn) {
        try {
          const eligibilityResponse = await ApiService.canUserReview(Number(id));
          setCanReview(eligibilityResponse.canReview);
        } catch (e) {
          setCanReview(false);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return navigate('/');
    if (!canReview) return;
    if (!ratingValid || !commentValid) return;

    setSubmitting(true);
    setError('');
    try {
      await ApiService.createReview(Number(id), Number(form.rating), form.comment.trim());
      setForm({ rating: 0, comment: '' });
      await refreshReviews();
    } catch (e) {
      if (e.message?.includes('401')) {
        navigate('/');
      }
      
      // Handle duplicate review error specifically
      if (e.message?.includes('already reviewed') || e.message?.includes('409')) {
        setError('You have already reviewed this laptop. To leave additional reviews, please go to your orders page and review from there.');
      } else {
        setError(e.message || 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!myReview) return;
    if (!ratingValid || !commentValid) return;
    setSubmitting(true);
    setError('');
    try {
      await ApiService.updateReview({
        reviewID: myReview.reviewID,
        rating: Number(form.rating),
        comment: form.comment.trim()
      });
      await refreshReviews();
    } catch (e) {
      setError(e.message || 'Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!window.confirm('Delete your review?')) return;
    setSubmitting(true);
    setError('');
    try {
      await ApiService.deleteReview(myReview.reviewID);
      await refreshReviews();
    } catch (e) {
      setError(e.message || 'Failed to delete review');
    } finally {
      setSubmitting(false);
    }
  };

  const setEditFromMine = () => {
    if (!myReview) return;
    setForm({ rating: Number(myReview.rating) || 0, comment: myReview.comment || '' });
  };

  if (loading) {
    return (
      <main className="pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-600 text-lg">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>
      </main>
    );
  }

  if (!laptop) return null;

  

  return (
    <main className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <button className="text-orange-600 hover:underline mb-6" onClick={() => navigate(-1)}>&larr; Back</button>

        <div className="bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            {laptop.image ? (
              <img
                src={`data:image/jpeg;base64,${Array.isArray(laptop.image) ? btoa(String.fromCharCode(...laptop.image)) : laptop.image}`}
                alt="Laptop"
                className="w-72 h-72 object-cover rounded-xl border"
              />
            ) : (
              <div className="w-72 h-72 flex items-center justify-center bg-gray-200 rounded-xl text-gray-400">No Image</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-orange-700">{laptop.brand} {laptop.model}</h1>
            <div className="text-xl mt-2">Price: <span className="font-bold">R{Number(laptop.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
            <div className="mt-2 text-gray-700">Specs: <span className="font-semibold">{laptop.specifications}</span></div>
            <div className="mt-2 text-gray-700">Condition: <span className="font-semibold">{laptop.laptopCondition}</span></div>
            <div className="mt-4 flex items-center gap-2">
              <div className="text-yellow-500">{avgRating} / 5</div>
              <div className="text-gray-400">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-gray-500">No reviews yet. Be the first to review!</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.reviewID} className="border rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{(() => {
                        if (r.user?.firstName && r.user?.lastName) {
                          return `${r.user.firstName} ${r.user.lastName}`;
                        }
                        const fallback = r.user?.username || r.user?.email || r.user?.userID || r.user?.id || r.user?.userId || r.user?.user_id || r.user?.user_id_fk || r.user;
                        if (fallback) return fallback;
                        try {
                          const userInfoStr = localStorage.getItem('userInfo');
                          if (userInfoStr) {
                            const userInfo = JSON.parse(userInfoStr);
                            if (userInfo.firstName && userInfo.lastName) {
                              return `${userInfo.firstName} ${userInfo.lastName}`;
                            }
                            return userInfo.username || userInfo.email || userInfo.userID || userInfo.id || userInfo.userId || userInfo.user_id || userInfo.user_id_fk || 'User';
                          }
                        } catch (e) {}
                        return 'User';
                      })()}</div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className={`h-4 w-4 ${i <= (Number(r.rating) || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    {myReview?.reviewID === r.reviewID && (
                      <div className="flex gap-2">
                        <button className="text-orange-600 hover:underline" onClick={setEditFromMine}>Edit</button>
                        <button className="text-red-600 hover:underline" onClick={handleDelete}>Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Review form */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Write a Review</h2>
          {!isLoggedIn ? (
            <div className="text-gray-600">
              Please <Link to="/" className="text-orange-600 underline">login</Link> to write a review.
            </div>
          ) : !canReview ? (
            <div className="text-gray-600">
              {hasPurchased && !isDelivered
                ? 'You can review after your order is delivered.'
                : 'Only customers who purchased this laptop can leave a review.'}
            </div>
          ) : myReview ? (
            <form className="bg-white border rounded-xl p-6 space-y-4" onSubmit={handleUpdate}>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({...f, rating: n}))} className={`h-8 w-8 ${n <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </button>
                ))}
              </div>
              <textarea value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))} rows={4} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" placeholder="Share your experience..."/>
              <div className="flex gap-3">
                <button type="submit" disabled={!ratingValid || !commentValid || submitting} className="bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Update Review</button>
                <button type="button" onClick={() => setForm({ rating: Number(myReview.rating)||0, comment: myReview.comment||'' })} className="border px-4 py-2 rounded-lg">Reset</button>
              </div>
            </form>
          ) : (
            <form className="bg-white border rounded-xl p-6 space-y-4" onSubmit={handleCreate}>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({...f, rating: n}))} className={`h-8 w-8 ${n <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </button>
                ))}
              </div>
              <textarea value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))} rows={4} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500" placeholder="Share your experience..."/>
              <button type="submit" disabled={!ratingValid || !commentValid || submitting} className="bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Submit Review</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}