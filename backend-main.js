// backend/src/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/snapshelf', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Routes
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/stores', require('./routes/store.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/auth', require('./routes/auth.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========================================
// backend/src/services/aiScraperService.js
// ========================================

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class AIScraperService {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeWebsite(url) {
    try {
      if (!this.browser) await this.initialize();
      
      const page = await this.browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract design elements
      const designData = await page.evaluate(() => {
        const extractColors = () => {
          const colors = new Set();
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            colors.add(style.color);
            colors.add(style.backgroundColor);
          });
          
          return Array.from(colors).filter(c => c && c !== 'rgba(0, 0, 0, 0)');
        };

        const extractFonts = () => {
          const fonts = new Set();
          const elements = document.querySelectorAll('*');
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            fonts.add(style.fontFamily);
          });
          
          return Array.from(fonts);
        };

        const extractLayout = () => {
          const header = document.querySelector('header, [role="banner"], .header, #header');
          const nav = document.querySelector('nav, [role="navigation"], .nav, .navbar');
          const main = document.querySelector('main, [role="main"], .main-content, #main');
          const footer = document.querySelector('footer, [role="contentinfo"], .footer, #footer');

          return {
            hasHeader: !!header,
            hasNav: !!nav,
            hasMainContent: !!main,
            hasFooter: !!footer,
            headerHeight: header ? header.offsetHeight : 0,
            footerHeight: footer ? footer.offsetHeight : 0
          };
        };

        return {
          colors: extractColors(),
          fonts: extractFonts(),
          layout: extractLayout(),
          title: document.title,
          meta: {
            description: document.querySelector('meta[name="description"]')?.content,
            keywords: document.querySelector('meta[name="keywords"]')?.content
          }
        };
      });

      // Extract product structure if e-commerce
      const products = await this.extractProducts($, page);
      
      // Take screenshots
      const screenshots = {
        desktop: await page.screenshot({ fullPage: true }),
        mobile: await this.getMobileScreenshot(page, url)
      };

      await page.close();

      return {
        url,
        html: html.substring(0, 10000), // Store first 10k chars
        design: designData,
        products,
        screenshots,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    }
  }

  async extractProducts($, page) {
    const products = [];
    
    // Common product selectors
    const productSelectors = [
      '.product', '.product-item', '.product-card',
      '[itemtype*="Product"]', '[data-product]'
    ];

    for (const selector of productSelectors) {
      const items = $(selector).slice(0, 10); // Get first 10 products
      
      if (items.length > 0) {
        items.each((i, el) => {
          const $el = $(el);
          products.push({
            name: $el.find('[itemprop="name"], .product-title, .product-name, h2, h3').first().text().trim(),
            price: $el.find('[itemprop="price"], .price, .product-price').first().text().trim(),
            image: $el.find('img').first().attr('src'),
            link: $el.find('a').first().attr('href')
          });
        });
        break;
      }
    }

    return products;
  }

  async getMobileScreenshot(page, url) {
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await page.goto(url, { waitUntil: 'networkidle2' });
    return await page.screenshot({ fullPage: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = new AIScraperService();

// ========================================
// backend/src/services/designAnalyzerService.js
// ========================================

const OpenAI = require('openai');
const sharp = require('sharp');
const colorThief = require('colorthief');

class DesignAnalyzerService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeDesign(scrapedData) {
    try {
      const analysis = {
        colors: await this.analyzeColors(scrapedData.design.colors),
        typography: this.analyzeTypography(scrapedData.design.fonts),
        layout: await this.analyzeLayout(scrapedData.design.layout),
        products: this.analyzeProductStructure(scrapedData.products),
        aiRecommendations: await this.getAIRecommendations(scrapedData)
      };

      return analysis;
    } catch (error) {
      console.error('Design analysis error:', error);
      throw error;
    }
  }

  async analyzeColors(colors) {
    // Process and categorize colors
    const processed = colors.map(color => {
      // Convert to hex
      const hex = this.rgbToHex(color);
      return {
        original: color,
        hex,
        usage: this.categorizeColor(hex)
      };
    });

    // Find primary, secondary, accent colors
    return {
      primary: processed[0]?.hex || '#000000',
      secondary: processed[1]?.hex || '#666666',
      accent: processed[2]?.hex || '#0066cc',
      all: processed
    };
  }

  analyzeTypography(fonts) {
    const processed = fonts.map(font => {
      const cleaned = font.replace(/['"]/g, '').split(',')[0].trim();
      return {
        family: cleaned,
        category: this.categorizeFontFamily(cleaned),
        fallback: this.getFontFallback(cleaned)
      };
    });

    return {
      heading: processed[0] || { family: 'Arial', category: 'sans-serif' },
      body: processed[1] || processed[0] || { family: 'Arial', category: 'sans-serif' },
      all: processed
    };
  }

  async analyzeLayout(layout) {
    return {
      structure: {
        header: layout.hasHeader,
        navigation: layout.hasNav,
        mainContent: layout.hasMainContent,
        footer: layout.hasFooter
      },
      dimensions: {
        headerHeight: layout.headerHeight,
        footerHeight: layout.footerHeight
      },
      recommendations: {
        mobileFirst: true,
        responsiveGrid: 'flexbox',
        breakpoints: {
          mobile: 768,
          tablet: 1024,
          desktop: 1440
        }
      }
    };
  }

  analyzeProductStructure(products) {
    if (!products || products.length === 0) return null;

    return {
      count: products.length,
      hasImages: products.some(p => p.image),
      hasPrices: products.some(p => p.price),
      structure: {
        nameField: 'name',
        priceField: 'price',
        imageField: 'image',
        linkField: 'link'
      },
      samples: products.slice(0, 3)
    };
  }

  async getAIRecommendations(scrapedData) {
    try {
      const prompt = `
        Analyze this e-commerce website and provide recommendations:
        URL: ${scrapedData.url}
        Colors: ${JSON.stringify(scrapedData.design.colors.slice(0, 5))}
        Fonts: ${JSON.stringify(scrapedData.design.fonts.slice(0, 3))}
        Has Products: ${scrapedData.products.length > 0}
        
        Provide JSON response with:
        1. Design improvements
        2. UX enhancements
        3. Mobile optimization tips
        4. Conversion optimization suggestions
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return {
        improvements: ["Modern design patterns", "Better color contrast", "Clear CTAs"],
        ux: ["Simplified navigation", "Faster load times", "Better mobile experience"],
        mobile: ["Touch-friendly buttons", "Responsive images", "Optimized fonts"],
        conversion: ["Clear value proposition", "Trust badges", "Simplified checkout"]
      };
    }
  }

  rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    
    const hex = (x) => {
      const h = parseInt(x).toString(16);
      return h.length === 1 ? '0' + h : h;
    };
    
    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  categorizeColor(hex) {
    // Simple categorization based on common use cases
    const rgb = this.hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    
    if (brightness > 200) return 'background';
    if (brightness < 50) return 'text';
    return 'accent';
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  categorizeFontFamily(font) {
    const serif = ['Times', 'Georgia', 'Garamond', 'Serif'];
    const sansSerif = ['Arial', 'Helvetica', 'Sans', 'Roboto', 'Open Sans'];
    const monospace = ['Courier', 'Monaco', 'Consolas', 'Monospace'];
    
    if (serif.some(s => font.includes(s))) return 'serif';
    if (monospace.some(m => font.includes(m))) return 'monospace';
    return 'sans-serif';
  }

  getFontFallback(font) {
    const category = this.categorizeFontFamily(font);
    return category === 'serif' ? 'Georgia, serif' : 
           category === 'monospace' ? 'Courier New, monospace' : 
           'Arial, sans-serif';
  }
}

module.exports = new DesignAnalyzerService();