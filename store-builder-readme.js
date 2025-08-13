// backend/src/services/storeBuilderService.js

const Store = require('../models/Store');
const fs = require('fs').promises;
const path = require('path');

class StoreBuilderService {
  constructor() {
    this.templates = new Map();
    this.components = new Map();
    this.loadTemplates();
  }

  async loadTemplates() {
    // Load predefined templates
    this.templates.set('modern', {
      id: 'modern',
      name: 'Modern Store',
      description: 'Clean and modern e-commerce template',
      preview: '/templates/modern/preview.jpg',
      features: ['Responsive', 'SEO Optimized', 'Fast Loading'],
      structure: {
        header: {
          type: 'sticky',
          components: ['logo', 'navigation', 'search', 'cart']
        },
        hero: {
          type: 'slider',
          height: '600px'
        },
        sections: ['featured-products', 'categories', 'testimonials', 'newsletter'],
        footer: {
          columns: 4,
          components: ['about', 'links', 'contact', 'social']
        }
      }
    });

    this.templates.set('minimal', {
      id: 'minimal',
      name: 'Minimal Store',
      description: 'Simple and elegant design',
      preview: '/templates/minimal/preview.jpg',
      features: ['Minimalist', 'Typography Focus', 'White Space'],
      structure: {
        header: {
          type: 'simple',
          components: ['logo', 'navigation', 'cart']
        },
        sections: ['products-grid', 'about', 'contact'],
        footer: {
          columns: 2,
          components: ['copyright', 'social']
        }
      }
    });
  }

  async generateTemplate(analysis) {
    // Generate custom template based on analyzed design
    const template = {
      id: `custom-${Date.now()}`,
      name: 'Custom Generated Template',
      baseTemplate: this.selectBaseTemplate(analysis),
      customizations: {
        colors: analysis.colors,
        typography: analysis.typography,
        layout: analysis.layout,
        components: this.selectComponents(analysis)
      },
      css: await this.generateCSS(analysis),
      html: await this.generateHTML(analysis)
    };

    return template;
  }

  selectBaseTemplate(analysis) {
    // Select best matching base template
    if (analysis.layout.structure.header && analysis.layout.structure.footer) {
      return 'modern';
    }
    return 'minimal';
  }

  selectComponents(analysis) {
    const components = [];
    
    if (analysis.products && analysis.products.count > 0) {
      components.push({
        type: 'product-grid',
        columns: 4,
        showPrice: analysis.products.hasPrices,
        showImage: analysis.products.hasImages
      });
    }

    if (analysis.layout.structure.navigation) {
      components.push({
        type: 'navigation',
        style: 'horizontal',
        position: 'header'
      });
    }

    components.push({
      type: 'search',
      position: 'header',
      style: 'inline'
    });

    components.push({
      type: 'cart',
      position: 'header',
      style: 'icon'
    });

    return components;
  }

  async generateCSS(analysis) {
    const { colors, typography } = analysis;
    
    const css = `
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-text: #333;
        --color-background: #fff;
        --font-heading: ${typography.heading.family}, ${typography.heading.fallback};
        --font-body: ${typography.body.family}, ${typography.body.fallback};
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: var(--font-body);
        color: var(--color-text);
        background-color: var(--color-background);
        line-height: 1.6;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
        line-height: 1.2;
        margin-bottom: 1rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      /* Header */
      .header {
        background: var(--color-background);
        border-bottom: 1px solid #eee;
        padding: 1rem 0;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* Navigation */
      .nav {
        display: flex;
        gap: 2rem;
      }

      .nav a {
        color: var(--color-text);
        text-decoration: none;
        transition: color 0.3s;
      }

      .nav a:hover {
        color: var(--color-primary);
      }

      /* Product Grid */
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 2rem;
        padding: 2rem 0;
      }

      .product-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.3s, box-shadow 0.3s;
      }

      .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      }

      .product-image {
        width: 100%;
        height: 300px;
        object-fit: cover;
      }

      .product-info {
        padding: 1rem;
      }

      .product-name {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }

      .product-price {
        color: var(--color-primary);
        font-size: 1.2rem;
        font-weight: bold;
      }

      /* Buttons */
      .btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: var(--color-primary);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: background 0.3s;
        border: none;
        cursor: pointer;
      }

      .btn:hover {
        background: var(--color-secondary);
      }

      /* Footer */
      .footer {
        background: #333;
        color: white;
        padding: 3rem 0 1rem;
        margin-top: 4rem;
      }

      .footer-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .header-content {
          flex-direction: column;
          gap: 1rem;
        }

        .nav {
          flex-direction: column;
          text-align: center;
        }

        .product-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }
      }
    `;

    return css;
  }

  async generateHTML(analysis) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{storeName}}</title>
        <meta name="description" content="{{storeDescription}}">
        <link rel="stylesheet" href="/css/store.css">
      </head>
      <body>
        <header class="header">
          <div class="container">
            <div class="header-content">
              <div class="logo">
                <h1>{{storeName}}</h1>
              </div>
              <nav class="nav">
                {{#navigation}}
                <a href="{{url}}">{{label}}</a>
                {{/navigation}}
              </nav>
              <div class="header-actions">
                <button class="search-btn">Search</button>
                <button class="cart-btn">Cart (0)</button>
              </div>
            </div>
          </div>
        </header>

        <main class="main">
          <section class="hero">
            <div class="container">
              <h2>Welcome to {{storeName}}</h2>
              <p>{{heroText}}</p>
            </div>
          </section>

          <section class="products">
            <div class="container">
              <h2>Featured Products</h2>
              <div class="product-grid">
                {{#products}}
                <div class="product-card">
                  <img src="{{image}}" alt="{{name}}" class="product-image">
                  <div class="product-info">
                    <h3 class="product-name">{{name}}</h3>
                    <p class="product-price">{{price}}</p>
                    <button class="btn">Add to Cart</button>
                  </div>
                </div>
                {{/products}}
              </div>
            </div>
          </section>
        </main>

        <footer class="footer">
          <div class="container">
            <div class="footer-content">
              <div class="footer-section">
                <h3>About Us</h3>
                <p>{{aboutText}}</p>
              </div>
              <div class="footer-section">
                <h3>Quick Links</h3>
                <ul>
                  {{#footerLinks}}
                  <li><a href="{{url}}">{{label}}</a></li>
                  {{/footerLinks}}
                </ul>
              </div>
              <div class="footer-section">
                <h3>Contact</h3>
                <p>{{contactInfo}}</p>
              </div>
            </div>
            <div class="footer-bottom">
              <p>&copy; 2024 {{storeName}}. All rights reserved.</p>
            </div>
          </div>
        </footer>

        <script src="/js/store.js"></script>
      </body>
      </html>
    `;

    return html;
  }

  async createStore({ userId, templateId, customizations, storeInfo }) {
    try {
      // Get template
      const template = this.templates.get(templateId) || await this.generateTemplate(customizations);

      // Create store in database
      const store = new Store({
        userId,
        name: storeInfo.name,
        subdomain: storeInfo.subdomain || storeInfo.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        template: {
          sourceUrl: storeInfo.sourceUrl,
          analyzedData: customizations,
          customizations: {
            colors: customizations.colors || template.customizations.colors,
            fonts: customizations.fonts || template.customizations.typography,
            logo: storeInfo.logo,
            favicon: storeInfo.favicon
          }
        },
        design: {
          layout: template.structure?.layout || 'single-column',
          theme: customizations.theme || 'light',
          components: template.customizations.components
        },
        settings: {
          language: storeInfo.language || 'en',
          currency: storeInfo.currency || 'USD',
          timezone: storeInfo.timezone || 'UTC'
        },
        seo: {
          title: storeInfo.seoTitle || storeInfo.name,
          description: storeInfo.seoDescription || `Welcome to ${storeInfo.name}`,
          keywords: storeInfo.keywords || []
        },
        status: 'draft'
      });

      await store.save();

      // Generate store files
      await this.generateStoreFiles(store, template);

      return store;
    } catch (error) {
      console.error('Store creation error:', error);
      throw error;
    }
  }

  async generateStoreFiles(store, template) {
    // This would generate actual store files in production
    // For now, we'll just log the action
    console.log(`Generating files for store: ${store.subdomain}`);
    
    // In production, you would:
    // 1. Create store directory
    // 2. Generate HTML files
    // 3. Generate CSS files
    // 4. Generate JS files
    // 5. Setup database
    // 6. Configure domain/subdomain
  }

  async getAvailableTemplates() {
    return Array.from(this.templates.values());
  }

  async updateStoreDesign(storeId, updates) {
    const store = await Store.findByIdAndUpdate(
      storeId,
      { $set: { 'template.customizations': updates } },
      { new: true }
    );

    // Regenerate store files with new design
    await this.generateStoreFiles(store, updates);

    return store;
  }
}

module.exports = new StoreBuilderService();

// ========================================
// README.md
// ========================================

# SnapShelf - AI-Powered E-commerce Store Builder

SnapShelf is an innovative platform that uses AI technology to analyze and recreate any e-commerce store design with improvements. Simply provide a URL, and our system will build you a complete, optimized online store.

## 🚀 Features

- **AI Store Analysis**: Scrape and analyze any e-commerce website
- **Automatic Design Recreation**: Generate optimized versions of existing stores
- **Multi-Platform Support**: Works with Shopify, WooCommerce, and custom sites
- **Responsive Design**: All stores are mobile, tablet, and desktop optimized
- **Payment Integration**: Built-in PayPal, Stripe, and major payment gateways
- **Real-time Analytics**: Track sales, traffic, and conversion rates
- **SEO Optimization**: Automatic SEO improvements for better rankings
- **Multi-language Support**: 10+ languages with RTL support

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6+
- Redis 7+ (optional, for caching)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/ilay123098/snapshelf.git
cd snapshelf
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Required
MONGODB_URI=mongodb://localhost:27017/snapshelf
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key

# Payment (optional)
STRIPE_SECRET_KEY=your-stripe-key
PAYPAL_CLIENT_ID=your-paypal-id
```

### 4. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 5. Run Development Servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Project Structure

```
snapshelf/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Custom middleware
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   └── package.json
└── README.md
```

## 📚 API Documentation

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### AI Store Generation
```http
POST /api/ai/analyze       # Analyze a website
POST /api/ai/generate      # Generate store from analysis
GET /api/ai/templates      # Get available templates
```

### Store Management
```http
GET /api/stores           # Get all stores
GET /api/stores/:id       # Get specific store
POST /api/stores          # Create store
PUT /api/stores/:id       # Update store
DELETE /api/stores/:id    # Delete store
```

### Products
```http
GET /api/products/store/:storeId    # Get store products
POST /api/products                  # Create product
PUT /api/products/:id               # Update product
DELETE /api/products/:id            # Delete product
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🚀 Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Set NODE_ENV to production
3. Use PM2 or similar for process management
4. Configure Nginx/Apache for reverse proxy
5. Setup SSL certificates

## 📦 Tech Stack

### Backend
- Node.js & Express
- MongoDB with Mongoose
- Puppeteer for web scraping
- OpenAI API for AI analysis
- JWT for authentication
- Stripe/PayPal for payments

### Frontend  
- React 18
- Redux Toolkit
- Material-UI
- Axios
- React Router

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@snapshelf.io or open an issue in the GitHub repository.

## 🙏 Acknowledgments

- OpenAI for GPT API
- Puppeteer team for the amazing scraping tool
- All contributors and testers

---

Built with ❤️ by the SnapShelf Team