# DealMachine Scraper Chrome Extension

A secure, cyberpunk-styled Chrome extension for controlled-access data scraping from dealmachine.com with robust authentication and admin management system.

## 🚀 Features

### Chrome Extension
- **Cyberpunk UI**: Futuristic animated interface with neon effects and grid backgrounds
- **Secure Authentication**: JWT-based login system with user approval workflow
- **Real-time Status**: Live connection status and scraping progress indicators
- **Toast Notifications**: Animated success/error notifications
- **Responsive Design**: Optimized popup interface with smooth animations

### Backend System
- **Next.js 15**: Modern React framework with App Router and Turbopack
- **PostgreSQL Database**: Robust data storage with Prisma ORM
- **JWT Authentication**: Secure token-based authentication system
- **User Approval System**: Admin-controlled access management
- **CORS Enabled**: Cross-origin support for extension communication

### Admin Panel
- **Cyberpunk Dashboard**: Matching futuristic design with the extension
- **User Management**: View, approve, and revoke user access
- **Real-time Stats**: Live user statistics and activity monitoring
- **Secure Access**: Admin-only authentication and authorization

### Data Scraping
- **High Performance**: Retains original scraper speed (seconds for full scrape)
- **Controlled Access**: Only approved users can execute scraping
- **Session Logging**: Track scraping activities and data counts
- **CSV Export**: Automatic download of scraped data in CSV format

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS v4, JavaScript (no TypeScript)
- **Backend**: Node.js, Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT, bcryptjs
- **Extension**: Chrome Extension Manifest v3
- **Styling**: Tailwind CSS v4 (latest configuration)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Chrome browser for extension testing

### Database Setup
1. Install and start PostgreSQL
2. Create database: `dealmachine_scraper`
3. Update connection string in `.env` file

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js  # Creates admin user
npm run dev
```

### Chrome Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` directory
4. The extension will appear in your browser toolbar

## 🔐 Default Admin Credentials

```
Email: admin@dealmachine.com
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

## 🎯 Usage

### For End Users
1. **Install Extension**: Load the extension in Chrome
2. **Register Account**: Click extension icon → Register with your details
3. **Wait for Approval**: Admin must approve your account
4. **Login & Scrape**: Once approved, login and use "INITIATE SCRAPE" button
5. **Navigate to DealMachine**: Must be on dealmachine.com to scrape data

### For Administrators
1. **Access Admin Panel**: Navigate to `http://localhost:3000/admin/login`
2. **Login**: Use admin credentials
3. **Manage Users**: View registered users and approve/revoke access
4. **Monitor Activity**: Track scraping sessions and user statistics

## 🏗️ Architecture

### Extension Components
- **Popup**: Main UI with authentication and scraping controls
- **Background Script**: Message handling and storage management
- **Content Script**: Communicates with webpage and backend
- **Scraper Script**: Injected scraping logic (your existing code)

### API Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Token verification
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/[id]/approve` - Approve user
- `POST /api/admin/users/[id]/revoke` - Revoke user access
- `POST /api/scraping/log` - Log scraping sessions

### Database Schema
```sql
-- Users table
users (
  id: String (Primary Key)
  email: String (Unique)
  password: String (Hashed)
  firstName: String
  lastName: String
  isApproved: Boolean (Default: false)
  isAdmin: Boolean (Default: false)
  createdAt: DateTime
  updatedAt: DateTime
)

-- Scraping sessions table
scraping_sessions (
  id: String (Primary Key)
  userId: String (Foreign Key)
  dataCount: Integer
  status: String
  createdAt: DateTime
)
```

## 🎨 UI Design

The extension features a complete cyberpunk aesthetic with:
- **Neon Color Palette**: Cyan, magenta, and yellow accents
- **Animated Backgrounds**: Moving grid patterns and glowing effects
- **Futuristic Typography**: Monospace fonts with letter spacing
- **Interactive Elements**: Hover effects and smooth transitions
- **Status Indicators**: Pulsing dots and animated status text
- **Loading States**: Spinning indicators and progress feedback

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Admin Authorization**: Separate admin access controls
- **User Approval System**: Manual approval required for scraping access
- **CORS Protection**: Controlled cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **Session Logging**: Track all scraping activities

## 🚦 Development

### Running in Development
```bash
# Start backend server
cd backend
npm run dev

# Extension development
# Load unpacked extension in Chrome for testing
```

### Environment Variables
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dealmachine_scraper?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
```

## 📝 File Structure

```
dealmachine-scraper-extension/
├── backend/                    # Next.js backend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/         # Admin panel pages
│   │   │   ├── api/           # API routes
│   │   │   └── globals.css    # Tailwind CSS imports
│   │   └── lib/
│   │       └── auth.js        # Authentication utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js           # Database seeding
│   ├── .env                   # Environment variables
│   └── package.json
├── chrome-extension/          # Chrome extension files
│   ├── popup/
│   │   ├── popup.html        # Extension popup UI
│   │   ├── popup.css         # Cyberpunk styling
│   │   └── popup.js          # Popup functionality
│   ├── icons/                # Extension icons
│   ├── manifest.json         # Extension manifest
│   ├── background.js         # Service worker
│   ├── content.js           # Content script
│   └── scraper.js           # Your scraping logic
└── README.md                 # This file
```

## 🔧 Customization

### Modifying Scraper Logic
Edit `chrome-extension/scraper.js` to customize the scraping behavior while maintaining the event-driven architecture.

### Styling Changes
Update `chrome-extension/popup/popup.css` for UI modifications or `backend/src/app/globals.css` for admin panel styling.

### Database Changes
Modify `backend/prisma/schema.prisma` and run `npx prisma migrate dev` to update the database schema.

## 🐛 Troubleshooting

### Common Issues
1. **Extension not loading**: Check manifest.json syntax and file paths
2. **Database connection**: Verify PostgreSQL is running and connection string is correct
3. **CORS errors**: Ensure Next.js CORS configuration is properly set
4. **Authentication failing**: Check JWT_SECRET environment variable

### Debug Mode
- Enable Chrome DevTools for extension debugging
- Check browser console for JavaScript errors
- Monitor Network tab for API request/response issues
- Use PostgreSQL logs for database debugging

## 📄 License

This project is for educational and development purposes. Ensure compliance with dealmachine.com's terms of service when using the scraping functionality.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console errors
3. Verify database and server status
4. Test API endpoints individually

---

**Built with ⚡ cyberpunk aesthetics and 🔒 enterprise-grade security**

