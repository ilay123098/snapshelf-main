// backend/src/models/Store.js
const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  subdomain: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  template: {
    sourceUrl: String,
    scrapedData: Object,
    analyzedData: Object,
    customizations: {
      colors: {
        primary: String,
        secondary: String,
        accent: String,
        background: String,
        text: String
      },
      fonts: {
        heading: String,
        body: String
      },
      logo: String,
      favicon: String
    }
  },
  design: {
    layout: {
      type: String,
      enum: ['single-column', 'two-column', 'grid', 'masonry'],
      default: 'single-column'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    components: [{
      type: String,
      position: Number,
      settings: Object
    }]
  },
  settings: {
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    paymentMethods: [{
      type: String,
      enum: ['stripe', 'paypal', 'square', 'manual']
    }],
    shipping: {
      enabled: Boolean,
      methods: [{
        name: String,
        price: Number,
        estimatedDays: Number
      }]
    },
    taxes: {
      enabled: Boolean,
      rate: Number
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    ogImage: String,
    googleAnalytics: String,
    facebookPixel: String
  },
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'maintenance', 'suspended'],
    default: 'draft'
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  customCode: {
    css: String,
    javascript: String,
    header: String,
    footer: String
  }
}, {
  timestamps: true
});

// Indexes
StoreSchema.index({ userId: 1, status: 1 });
StoreSchema.index({ domain: 1 });
StoreSchema.index({ subdomain: 1 });

// Virtual for full URL
StoreSchema.virtual('url').get(function() {
  if (this.domain) {
    return `https://${this.domain}`;
  }
  return `https://${this.subdomain}.snapshelf.io`;
});

module.exports = mongoose.model('Store', StoreSchema);

// ========================================
// backend/src/models/Product.js
// ========================================

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  description: String,
  shortDescription: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  sku: String,
  barcode: String,
  trackQuantity: {
    type: Boolean,
    default: true
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  images: [{
    url: String,
    alt: String,
    position: Number
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [String],
  variants: [{
    name: String,
    options: [{
      value: String,
      price: Number,
      quantity: Number,
      sku: String
    }]
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
ProductSchema.index({ storeId: 1, status: 1 });
ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);

// ========================================
// backend/src/models/User.js
// ========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String,
  phone: String,
  avatar: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'super-admin'],
    default: 'user'
  },
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due'],
      default: 'active'
    },
    currentPeriodEnd: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  preferences: {
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  verified: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false }
  },
  tokens: {
    emailVerification: String,
    passwordReset: String,
    passwordResetExpires: Date
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// ========================================
// backend/src/controllers/aiController.js
// ========================================

const aiScraperService = require('../services/aiScraperService');
const designAnalyzerService = require('../services/designAnalyzerService');
const storeBuilderService = require('../services/storeBuilderService');
const Store = require('../models/Store');

class AIController {
  async analyzeWebsite(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Step 1: Scrape website
      console.log('Scraping website:', url);
      const scrapedData = await aiScraperService.scrapeWebsite(url);
      
      // Step 2: Analyze design
      console.log('Analyzing design...');
      const analysis = await designAnalyzerService.analyzeDesign(scrapedData);
      
      // Step 3: Generate store template
      console.log('Generating template...');
      const template = await storeBuilderService.generateTemplate(analysis);

      res.json({
        success: true,
        data: {
          sourceUrl: url,
          scrapedData: {
            title: scrapedData.design.title,
            colors: scrapedData.design.colors.slice(0, 5),
            fonts: scrapedData.design.fonts.slice(0, 3),
            productsFound: scrapedData.products.length
          },
          analysis,
          template,
          preview: {
            desktop: scrapedData.screenshots.desktop.toString('base64'),
            mobile: scrapedData.screenshots.mobile.toString('base64')
          }
        }
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze website',
        message: error.message 
      });
    }
  }

  async generateStore(req, res) {
    try {
      const { templateId, customizations, storeInfo } = req.body;
      const userId = req.user.id;

      // Create store from template
      const store = await storeBuilderService.createStore({
        userId,
        templateId,
        customizations,
        storeInfo
      });

      res.json({
        success: true,
        data: {
          storeId: store._id,
          url: store.url,
          status: store.status
        }
      });
    } catch (error) {
      console.error('Store generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate store',
        message: error.message 
      });
    }
  }

  async getTemplates(req, res) {
    try {
      const templates = await storeBuilderService.getAvailableTemplates();
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Template fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch templates',
        message: error.message 
      });
    }
  }

  async improveDesign(req, res) {
    try {
      const { storeId } = req.params;
      const store = await Store.findById(storeId);
      
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      // Get AI recommendations for improvements
      const improvements = await designAnalyzerService.getAIRecommendations({
        url: store.url,
        design: store.design,
        analytics: store.analytics
      });

      res.json({
        success: true,
        data: improvements
      });
    } catch (error) {
      console.error('Design improvement error:', error);
      res.status(500).json({ 
        error: 'Failed to get design improvements',
        message: error.message 
      });
    }
  }
}

module.exports = new AIController();

// ========================================
// backend/src/controllers/storeController.js
// ========================================

const Store = require('../models/Store');
const Product = require('../models/Product');

class StoreController {
  async getAllStores(req, res) {
    try {
      const userId = req.user.id;
      const stores = await Store.find({ userId }).select('-template.scrapedData');
      
      res.json({
        success: true,
        data: stores
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch stores',
        message: error.message 
      });
    }
  }

  async getStore(req, res) {
    try {
      const { id } = req.params;
      const store = await Store.findById(id);
      
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch store',
        message: error.message 
      });
    }
  }

  async createStore(req, res) {
    try {
      const userId = req.user.id;
      const storeData = {
        ...req.body,
        userId,
        subdomain: req.body.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      };

      const store = new Store(storeData);
      await store.save();

      res.status(201).json({
        success: true,
        data: store
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create store',
        message: error.message 
      });
    }
  }

  async updateStore(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const store = await Store.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({
        success: true,
        data: store
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to update store',
        message: error.message 
      });
    }
  }

  async deleteStore(req, res) {
    try {
      const { id } = req.params;
      
      // Delete store and all related data
      await Store.findByIdAndDelete(id);
      await Product.deleteMany({ storeId: id });

      res.json({
        success: true,
        message: 'Store deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to delete store',
        message: error.message 
      });
    }
  }

  async publishStore(req, res) {
    try {
      const { id } = req.params;
      
      const store = await Store.findByIdAndUpdate(
        id,
        { status: 'published' },
        { new: true }
      );

      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }

      res.json({
        success: true,
        data: store,
        message: 'Store published successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to publish store',
        message: error.message 
      });
    }
  }
}

module.exports = new StoreController();