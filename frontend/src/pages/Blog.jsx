import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Calendar, User, ArrowRight, BookOpen, Share2, X, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { getArticleSchema } from '../utils/seoSchemas';
import { BLOG_POSTS } from '../constants/mockData';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const categories = ['All', 'Backpacking Tips', 'Himalayan Expeditions', 'Cultural Experiences', 'Packing Guides'];

  // Filter posts
  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      post.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const featuredPost = BLOG_POSTS[0];
  const articleSchema = getArticleSchema(selectedArticle || featuredPost);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-24">
      <SEOHead
        title="Travel Blog, Packing Guides & Itineraries | WanderLuxe"
        description="Read expert travel guides, high-altitude packing lists, and destination itineraries written by certified WanderLuxe trip captains."
        canonical="/blog"
        jsonLd={articleSchema}
      />

      {/* Article Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-10 shadow-2xl relative my-8 border border-gray-100 max-h-[90vh] overflow-y-auto text-brand-navy"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-navy rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={22} />
              </button>

              <div className="mb-6">
                <span className="bg-brand-emerald/10 text-brand-emerald text-xs font-bold px-3 py-1 rounded-full border border-brand-emerald/20 inline-block mb-3">
                  {selectedArticle.category}
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold text-brand-navy leading-tight mb-4">
                  {selectedArticle.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedArticle.author.avatar}
                      alt={selectedArticle.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-brand-emerald"
                    />
                    <span className="font-bold text-brand-navy">{selectedArticle.author.name}</span>
                  </div>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {selectedArticle.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {selectedArticle.readTime}</span>
                </div>
              </div>

              {/* Cover Image */}
              <div className="h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-md">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Body */}
              <div className="prose max-w-none text-gray-600 space-y-4 text-sm md:text-base leading-relaxed font-medium">
                {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Contextual Internal Link to Related Package (PDF Section 14) */}
              <div className="mt-8 p-6 bg-brand-light rounded-2xl border border-brand-emerald/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-brand-emerald uppercase tracking-wider">Related Expedition Package</span>
                  <h3 className="text-sm font-extrabold text-brand-navy">Ready to Experience This Destination Live?</h3>
                  <p className="text-xs text-gray-500 font-medium">Join our next community departure led by certified trip captains.</p>
                </div>
                <Link
                  to="/destinations"
                  className="px-5 py-2.5 bg-brand-emerald text-white rounded-xl text-xs font-extrabold hover:bg-brand-teal transition-all shrink-0"
                >
                  Explore Tour Packages
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-6 py-2.5 bg-brand-navy text-white text-xs font-bold rounded-2xl hover:bg-brand-emerald transition-colors"
                >
                  Close Article
                </button>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Share2 size={16} /> Share Story
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-8">
        <Breadcrumbs items={[{ name: 'Travel Blog & Guides', path: '/blog' }]} />

        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="bg-brand-emerald/10 text-brand-emerald text-xs font-extrabold px-3.5 py-1.5 rounded-full inline-block mb-3 border border-brand-emerald/20">
            WanderLuxe Travel Tales
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-navy mb-4 leading-tight">
            Stories, Guides & Backpacking Inspiration
          </h1>
          <p className="text-gray-600 text-sm md:text-base font-medium">
            Handcrafted travel guides written by our expedition leaders. Learn tips for high-altitude trekking, cultural immersion, and group departures.
          </p>
        </div>

        {/* Featured Story Banner */}
        {featuredPost && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 mb-12 grid grid-cols-1 lg:grid-cols-2">
            <div className="h-64 lg:h-auto relative overflow-hidden">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <span className="absolute top-4 left-4 bg-brand-emerald text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-lg">
                Featured Story
              </span>
            </div>

            <div className="p-8 lg:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mb-3">
                  <span className="text-brand-emerald">{featuredPost.category}</span>
                  <span>•</span>
                  <span>{featuredPost.readTime}</span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-extrabold text-brand-navy mb-4 leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <img
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-brand-emerald"
                  />
                  <div>
                    <h3 className="text-xs font-extrabold text-brand-navy">{featuredPost.author.name}</h3>
                    <p className="text-[11px] text-gray-400">{featuredPost.author.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedArticle(featuredPost)}
                  className="px-5 py-2.5 bg-brand-navy text-white rounded-2xl text-xs font-bold hover:bg-brand-emerald transition-colors flex items-center gap-2 shadow-md"
                >
                  Read Story <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200/80 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search travel stories..."
              className="w-full pl-11 pr-4 py-3 bg-brand-light border border-gray-200 rounded-2xl text-xs font-bold text-brand-navy focus:outline-none focus:border-brand-emerald"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-brand-emerald text-white shadow-md shadow-brand-emerald/20'
                    : 'bg-brand-light text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Article Cards Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedArticle(post)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
              >
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-brand-navy/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2">
                      <Clock size={14} className="text-brand-emerald" /> {post.readTime}
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>

                    <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-emerald transition-colors leading-snug mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 font-medium">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover border border-brand-emerald"
                      />
                      <span className="text-xs font-bold text-brand-navy">{post.author.name}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-emerald group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Read <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 max-w-md mx-auto mb-16">
            <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-brand-navy mb-2">No Articles Found</h3>
            <p className="text-gray-500 text-sm">Try resetting your search filter keyword.</p>
          </div>
        )}

        {/* Newsletter Subscription Card */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-teal rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto text-brand-emerald">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold">Join 25,000+ Travel Enthusiasts</h2>
            <p className="text-white/80 text-sm font-medium">
              Get weekly destination secrets, packing guides, and early access to discounted Himalayan departures directly in your inbox.
            </p>

            {subscribed ? (
              <div className="bg-white/20 p-4 rounded-2xl font-bold text-sm text-brand-emerald flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> You're subscribed! Check your inbox for our latest travel guide.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 pt-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-5 py-3.5 rounded-2xl bg-white text-brand-navy text-sm font-medium focus:outline-none placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-brand-emerald text-white rounded-2xl font-extrabold text-sm hover:bg-brand-teal transition-all shadow-lg shrink-0 flex items-center justify-center gap-2"
                >
                  Subscribe <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
