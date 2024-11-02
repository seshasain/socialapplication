import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  BarChart2,
  Users2,
  Zap,
  Shield,
  Globe2,
  Clock,
  Award,
  CheckCircle,
  TrendingUp,
  Target,
  MessageCircle,
  Layout,
  ArrowUp,
  Instagram,
  Facebook,
  Users,
  Heart,
  Share2,
  Eye,
  MessageSquare,
  BarChart,
  Hash,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-8">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <Layout className="h-8 w-8 text-white" />
                  </div>
                  <span className="ml-3 text-2xl font-bold text-gray-900">
                    SocialSync
                  </span>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Transform Your</span>{' '}
                  <span className="block text-blue-600 xl:inline">
                    Social Media Strategy
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Elevate your brand's social presence with AI-powered
                  scheduling, real-time analytics, and content optimization.
                  Trusted by over 10,000+ businesses to drive engagement and
                  grow their audience.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/pricing"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 md:py-4 md:text-lg md:px-10 transition-all duration-200"
                    >
                      View Pricing
                    </Link>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-4">
                  <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-600">14-day free trial</span>
                  </div>
                  <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-600">
                      No credit card required
                    </span>
                  </div>
                  <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-gray-600">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Demo Window */}
        <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-600 p-8 flex items-center justify-center">
            <div className="bg-white w-[800px] h-[600px] rounded-xl shadow-2xl overflow-hidden relative transform rotate-2 hover:rotate-0 transition-all duration-300">
              {/* Window Controls */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gray-50 border-b flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-white rounded-md shadow-sm text-sm text-gray-600 flex items-center">
                    <Layout className="w-4 h-4 mr-2 text-blue-600" />
                    SocialSync Dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="pt-12 p-6 h-full bg-gray-50">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      label: 'Total Reach',
                      value: '2.1M',
                      icon: Users,
                      change: '+28%',
                      color: 'blue',
                    },
                    {
                      label: 'Engagement',
                      value: '486K',
                      icon: Heart,
                      change: '+42%',
                      color: 'pink',
                    },
                    {
                      label: 'Shares',
                      value: '95.2K',
                      icon: Share2,
                      change: '+16%',
                      color: 'purple',
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`bg-gradient-to-br ${
                        i === 1
                          ? 'from-pink-500 to-rose-600'
                          : i === 2
                          ? 'from-purple-500 to-indigo-600'
                          : 'from-blue-500 to-indigo-600'
                      } p-4 rounded-xl text-white transform hover:-translate-y-1 transition-all duration-300`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm opacity-90">{stat.label}</p>
                          <h3 className="text-2xl font-bold mt-1">
                            {stat.value}
                          </h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg">
                          <stat.icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center mt-2 text-sm">
                        <ArrowUp className="w-4 h-4" />
                        <span className="ml-1">{stat.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Performance Analytics */}
                <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-800 flex items-center">
                        <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                        Performance Analytics
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Last 7 days performance
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-600">
                          Engagement
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                        <span className="text-sm text-gray-600">Reach</span>
                      </div>
                      <select className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-gray-50">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                      <span>100K</span>
                      <span>75K</span>
                      <span>50K</span>
                      <span>25K</span>
                      <span>0</span>
                    </div>

                    <div className="ml-8 h-40 flex items-end space-x-2">
                      {[
                        { engagement: 65, reach: 72 },
                        { engagement: 85, reach: 92 },
                        { engagement: 55, reach: 48 },
                        { engagement: 98, reach: 88 },
                        { engagement: 75, reach: 82 },
                        { engagement: 92, reach: 96 },
                        { engagement: 70, reach: 75 },
                      ].map((day, i) => (
                        <div
                          key={i}
                          className="flex-1 flex items-end space-x-1"
                        >
                          <div
                            style={{ height: `${day.engagement}%` }}
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg relative group"
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">
                                {day.engagement}K engagements
                              </div>
                              <div className="text-blue-300 text-[10px]">
                                {
                                  [
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                  ][i]
                                }
                              </div>
                            </div>
                          </div>
                          <div
                            style={{ height: `${day.reach}%` }}
                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg relative group"
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              <div className="font-medium">
                                {day.reach}K reach
                              </div>
                              <div className="text-blue-300 text-[10px]">
                                {
                                  [
                                    'Mon',
                                    'Tue',
                                    'Wed',
                                    'Thu',
                                    'Fri',
                                    'Sat',
                                    'Sun',
                                  ][i]
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ml-8 mt-2 grid grid-cols-7 text-xs text-gray-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                        (day) => (
                          <div key={day} className="text-center">
                            {day}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      {
                        label: 'Avg. Engagement Rate',
                        value: '4.8%',
                        icon: Heart,
                        change: '+0.6%',
                        color: 'rose',
                      },
                      {
                        label: 'Impressions',
                        value: '892K',
                        icon: Eye,
                        change: '+12%',
                        color: 'blue',
                      },
                      {
                        label: 'Hashtag Reach',
                        value: '245K',
                        icon: Hash,
                        change: '+8%',
                        color: 'indigo',
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {metric.label}
                          </span>
                          <metric.icon
                            className={`w-4 h-4 text-${metric.color}-500`}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {metric.value}
                          </span>
                          <span className="text-xs text-green-500 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            {metric.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Posts */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      platform: 'instagram',
                      engagement: '24.5K',
                      image:
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop',
                    },
                    {
                      platform: 'facebook',
                      engagement: '18.2K',
                      image:
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop',
                    },
                  ].map((post, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl overflow-hidden shadow-sm group hover:shadow-lg transition-all duration-300"
                    >
                      <div className="relative h-24">
                        <img
                          src={post.image}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 flex items-center text-white">
                          {post.platform === 'instagram' ? (
                            <Instagram className="w-4 h-4 mr-1" />
                          ) : (
                            <Facebook className="w-4 h-4 mr-1" />
                          )}
                          <span className="text-sm font-medium">
                            {post.engagement} likes
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '10K+', label: 'Active Users', color: 'blue' },
              { value: '98%', label: 'Customer Satisfaction', color: 'green' },
              { value: '5M+', label: 'Posts Published', color: 'purple' },
              { value: '150%', label: 'Avg. ROI Increase', color: 'indigo' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className={`text-3xl font-bold text-${stat.color}-600`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 text-center mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed on social media
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Streamline your workflow, boost engagement, and grow your social
              media presence with our comprehensive suite of tools.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'AI-Powered Scheduling',
                  description:
                    'Our smart algorithm determines the best times to post for maximum engagement based on your audiences activity.',
                  icon: Calendar,
                  color: 'blue',
                },
                {
                  title: 'Advanced Analytics',
                  description:
                    'Get detailed insights into your performance with real-time metrics, custom reports, and competitor analysis.',
                  icon: BarChart2,
                  color: 'green',
                },
                {
                  title: 'Team Collaboration',
                  description:
                    'Seamlessly work together with role-based access, approval workflows, and real-time notifications.',
                  icon: Users2,
                  color: 'purple',
                },
                {
                  title: 'Content Optimization',
                  description:
                    'AI-powered suggestions help you create engaging content that resonates with your audience.',
                  icon: Target,
                  color: 'red',
                },
                {
                  title: 'Multi-Platform Management',
                  description:
                    'Manage all your social media accounts from one centralized dashboard with unified inbox.',
                  icon: Globe2,
                  color: 'indigo',
                },
                {
                  title: 'Performance Tracking',
                  description:
                    'Track ROI, engagement rates, and audience growth with customizable dashboards.',
                  icon: TrendingUp,
                  color: 'yellow',
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative p-8 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-50 to-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                  <div className="relative">
                    <div
                      className={`p-3 bg-${feature.color}-100 rounded-xl w-fit`}
                    >
                      <feature.icon
                        className={`h-6 w-6 text-${feature.color}-600`}
                      />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Trusted by leading brands worldwide
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Join thousands of businesses that trust SocialSync to manage their
              social media presence
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {[
              {
                quote:
                  "SocialSync has transformed our social media strategy. We've seen a 200% increase in engagement since switching.",
                author: 'Sarah Johnson',
                role: 'Marketing Director',
                company: 'Tech Innovators Inc.',
                image:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              },
              {
                quote:
                  'The AI-powered scheduling and analytics have saved us countless hours and improved our ROI significantly.',
                author: 'Michael Chen',
                role: 'Social Media Manager',
                company: 'Growth Dynamics',
                image:
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
              },
              {
                quote:
                  "Best investment we've made for our social media management. The team collaboration features are outstanding.",
                author: 'Emma Williams',
                role: 'CEO',
                company: 'Creative Solutions',
                image:
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="relative">
                  <div className="absolute -top-4 -left-4 text-blue-200 transform -rotate-180">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="currentColor"
                    >
                      <path d="M12 4C5.4 8.6 1 15.5 1 23.5c0 6.4 3.9 10.5 8.3 10.5 4.2 0 7.4-3.4 7.4-7.4 0-4-2.8-7-6.4-7-0.7 0-1.7 0.1-1.9 0.2 0.6-4.1 4.5-9 8.3-11.3L12 4zm20.5 0c-6.6 4.6-11 11.5-11 19.5 0 6.4 3.9 10.5 8.3 10.5 4.2 0 7.4-3.4 7.4-7.4 0-4-2.8-7-6.4-7-0.7 0-1.7 0.1-1.9 0.2 0.6-4.1 4.5-9 8.3-11.3L32.5 4z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6 relative z-10">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center">
                    <img
                      className="h-12 w-12 rounded-full object-cover ring-4 ring-blue-50"
                      src={testimonial.image}
                      alt={testimonial.author}
                    />
                    <div className="ml-4">
                      <div className="text-lg font-medium text-gray-900">
                        {testimonial.author}
                      </div>
                      <div className="text-blue-600">{testimonial.role}</div>
                      <div className="text-gray-500 text-sm">
                        {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">
              Ready to transform your social media presence?
            </span>
            <span className="block text-blue-200">
              Start your free trial today.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0 space-x-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get started
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-xl text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden">
        <h1>SocialSync - AI-Powered Social Media Management Platform</h1>
        <h2>
          Automate Your Social Media Marketing | Analytics & Scheduling Tools
        </h2>
        <p>
          SocialSync is the leading social media management platform for
          businesses and marketers. Schedule posts, analyze performance, and
          grow your social media presence across Instagram, Facebook, Twitter,
          and LinkedIn. Features include AI-powered scheduling, advanced
          analytics, team collaboration, and automated publishing.
        </p>
        <p>
          Keywords: social media management software, social media scheduler,
          social media analytics, social media marketing tools, Instagram
          management, Facebook management, Twitter management, LinkedIn
          management, social media automation, content calendar, team
          collaboration, social media ROI, social media metrics, social media
          strategy, digital marketing tools
        </p>
      </div>
    </div>
  );
}
