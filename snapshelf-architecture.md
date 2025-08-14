# SnapShelf - ארכיטקטורת המערכת

## מבנה הפרויקט
```
snapshelf/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── aiController.js
│   │   │   ├── storeController.js
│   │   │   ├── productController.js
│   │   │   ├── paymentController.js
│   │   │   └── analyticsController.js
│   │   ├── services/
│   │   │   ├── aiScraperService.js
│   │   │   ├── designAnalyzerService.js
│   │   │   ├── storeBuilderService.js
│   │   │   ├── paymentService.js
│   │   │   └── seoService.js
│   │   ├── models/
│   │   │   ├── Store.js
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   └── User.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── app.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StoreBuilder/
│   │   │   ├── AIGenerator/
│   │   │   ├── Dashboard/
│   │   │   └── Analytics/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── database/
    └── migrations/
```

## טכנולוגיות עיקריות

### Backend
- **Node.js + Express** - שרת API
- **MongoDB** - מסד נתונים
- **Puppeteer** - לסריקת אתרים
- **OpenAI API** - לניתוח AI
- **Stripe/PayPal SDK** - תשלומים
- **Sharp** - עיבוד תמונות
- **Redis** - cache ו-sessions

### Frontend
- **React** - ממשק משתמש
- **Redux Toolkit** - ניהול state
- **Material-UI** - עיצוב
- **Recharts** - גרפים לאנליטיקס
- **React Router** - ניווט

## תהליך העבודה המרכזי

### 1. סריקת אתר מקור
```javascript
// aiScraperService.js
async function scrapeWebsite(url) {
  // סריקת HTML, CSS, תמונות
  // חילוץ מבנה העמודים
  // זיהוי פלטפורמה (Shopify, WooCommerce, etc.)
  // חילוץ סכמת צבעים ופונטים
}
```

### 2. ניתוח AI
```javascript
// designAnalyzerService.js
async function analyzeDesign(scrapedData) {
  // ניתוח layout ו-grid
  // זיהוי קומפוננטות (header, navbar, products, footer)
  // חילוץ UX patterns
  // המלצות לשיפור
}
```

### 3. בניית חנות
```javascript
// storeBuilderService.js
async function buildStore(template, customization) {
  // יצירת מבנה החנות
  // התאמה אישית של עיצוב
  // הגדרת דפים ותפריטים
  // אופטימיזציה למובייל
}
```

## מודלים של מסד נתונים

### Store Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,
  domain: String,
  template: {
    sourceUrl: String,
    analyzedData: Object,
    customizations: Object
  },
  design: {
    colors: Object,
    fonts: Object,
    layout: Object
  },
  products: [ObjectId],
  settings: {
    language: String,
    currency: String,
    paymentMethods: Array
  },
  analytics: {
    views: Number,
    orders: Number,
    revenue: Number
  },
  createdAt: Date,
  status: String
}
```

## API Endpoints עיקריים

### AI Generation
- `POST /api/ai/analyze` - ניתוח URL
- `POST /api/ai/generate` - יצירת חנות
- `GET /api/ai/templates` - תבניות מוכנות

### Store Management
- `GET /api/stores` - רשימת חנויות
- `POST /api/stores` - יצירת חנות
- `PUT /api/stores/:id` - עדכון חנות
- `DELETE /api/stores/:id` - מחיקת חנות

### Products
- `GET /api/stores/:storeId/products` - מוצרים
- `POST /api/stores/:storeId/products` - הוספת מוצר
- `PUT /api/products/:id` - עדכון מוצר

### Analytics
- `GET /api/analytics/:storeId/overview` - סקירה כללית
- `GET /api/analytics/:storeId/sales` - נתוני מכירות
- `GET /api/analytics/:storeId/traffic` - תעבורה

### Payments
- `POST /api/payments/process` - עיבוד תשלום
- `GET /api/payments/methods` - אמצעי תשלום

## Features מרכזיים למימוש

### Phase 1 - Core (שבועיים)
- [ ] סריקת אתר בסיסית
- [ ] ניתוח עיצוב פשוט
- [ ] יצירת חנות בסיסית
- [ ] ניהול מוצרים
- [ ] מערכת משתמשים

### Phase 2 - AI Enhancement (שבועיים)
- [ ] ניתוח AI מתקדם
- [ ] המלצות אוטומטיות
- [ ] אופטימיזציה חכמה
- [ ] תבניות מותאמות אישית

### Phase 3 - E-commerce (שבועיים)
- [ ] עגלת קניות
- [ ] תהליך checkout
- [ ] שערי תשלום
- [ ] ניהול הזמנות
- [ ] מערכת משלוחים

### Phase 4 - Advanced (שבועיים)
- [ ] אנליטיקס מתקדם
- [ ] SEO אוטומטי
- [ ] תמיכה רב-לשונית
- [ ] A/B Testing
- [ ] Marketing automation

## סביבת פיתוח

### דרישות
- Node.js 18+
- MongoDB 6+
- Redis 7+
- npm/yarn

### התקנה
```bash
# Clone repository
git clone https://github.com/ilay123098/snapshelf

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env

# Run development servers
npm run dev
```

## אבטחה
- JWT authentication
- Rate limiting
- Input validation
- XSS protection
- SQL injection prevention
- HTTPS enforcement
- Data encryption