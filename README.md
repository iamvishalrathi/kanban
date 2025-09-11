# Real-time Collaborative Kanban Board

A professional, production-ready Kanban board application with real-time collaboration features, built with React.js frontend and Node.js backend.

## 🚀 Features

### Core Features
- **Real-time Collaboration**: Multiple users can work simultaneously with live updates
- **Drag & Drop Interface**: Intuitive card and column management
- **Board Management**: Create, duplicate, export, and manage multiple boards
- **Card System**: Rich cards with descriptions, due dates, labels, and assignments
- **Comments**: Threaded comments with mentions and notifications
- **User Management**: Role-based access control (Owner, Admin, Editor, Viewer)
- **Activity Tracking**: Comprehensive audit logs for all actions
- **Notifications**: Real-time and email notifications

### Technical Features
- **WebSocket Integration**: Real-time updates using Socket.IO
- **Optimistic UI**: Immediate UI updates with conflict resolution
- **Presence Indicators**: See who's online and typing
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Performance Optimized**: Efficient caching and database queries
- **Security**: JWT authentication, rate limiting, input validation
- **Email Integration**: SendGrid for notifications and invitations

## 🛠 Tech Stack

### Frontend
- **React 18** with hooks and modern patterns
- **Vite** for fast development and building
- **Tailwind CSS** for styling and responsive design
- **Framer Motion** for animations
- **React Query** for data fetching and caching
- **Zustand** for state management
- **Socket.IO Client** for real-time communication
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js framework
- **Socket.IO** for WebSocket communication
- **Sequelize ORM** with PostgreSQL
- **Redis** for caching and presence tracking
- **JWT** for authentication
- **SendGrid** for email services
- **Helmet** for security headers
- **Rate limiting** and input validation

### Database & Services
- **Supabase PostgreSQL** for primary database
- **Upstash Redis** for caching and real-time features
- **SendGrid** for email notifications

## 📦 Installation & Setup

### Prerequisites
- Node.js 18 or higher
- Docker (for containerized deployment)
- PostgreSQL database (Supabase recommended)
- Redis instance (Upstash recommended)
- SendGrid account for emails

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kanban
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**
   
   Create `.env` file in the backend directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database Configuration (Supabase PostgreSQL)
   DATABASE_URL=postgresql://username:password@db.supabase.co:5432/postgres

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d

   # Redis Configuration (Upstash)
   REDIS_URL=redis://username:password@redis-host:6379

   # Email Configuration (SendGrid)
   SENDGRID_API_KEY=your-sendgrid-api-key
   FROM_EMAIL=noreply@yourapp.com
   FROM_NAME=Kanban App

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

5. **Database Setup**
   ```bash
   cd backend
   npm run db:migrate  # Run database migrations
   ```

6. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Docker Deployment

1. **Build and Run with Docker**
   ```bash
   docker build -t kanban-app .
   docker run -p 80:80 \
     -e DATABASE_URL="your-database-url" \
     -e REDIS_URL="your-redis-url" \
     -e SENDGRID_API_KEY="your-sendgrid-key" \
     -e JWT_SECRET="your-jwt-secret" \
     kanban-app
   ```

2. **Deploy to Render.com**
   - Connect your repository to Render
   - Use Docker deployment
   - Set environment variables in Render dashboard
   - The app will be available at your Render URL

## 🎯 Usage

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Create Board**: Start with a new Kanban board
3. **Add Columns**: Create workflow columns (e.g., To Do, In Progress, Done)
4. **Create Cards**: Add tasks with descriptions, due dates, and assignments
5. **Invite Team**: Share boards with team members
6. **Collaborate**: Work together in real-time!

### Key Features Usage

#### Board Management
- **Create Board**: Click "New Board" and customize settings
- **Duplicate Board**: Use templates or copy existing boards
- **Export Board**: Download board data as JSON
- **Board Settings**: Configure visibility, templates, and permissions

#### Card Operations
- **Drag & Drop**: Move cards between columns or reorder within columns
- **Rich Editing**: Add descriptions, due dates, labels, and attachments
- **Assignments**: Assign cards to team members
- **Comments**: Add threaded comments with mentions
- **History**: Track all changes with audit trail

#### Real-time Features
- **Live Updates**: See changes from other users instantly
- **Presence Indicators**: Green dots show who's online
- **Typing Indicators**: See when someone is typing a comment
- **Conflict Resolution**: Automatic handling of simultaneous edits

#### Team Collaboration
- **Role Management**: Owner, Admin, Editor, Viewer permissions
- **Invitations**: Email invites with role assignment
- **Notifications**: Real-time and email alerts for important events
- **Activity Feed**: Track all board activities

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **SQL Injection Protection** via Sequelize ORM
- **XSS Protection** with Helmet security headers
- **CORS Configuration** for cross-origin requests
- **Password Hashing** with bcrypt
- **Environment Variables** for sensitive data

## 📊 Performance Optimizations

- **Redis Caching** for frequently accessed data
- **Optimistic UI Updates** for instant feedback
- **Database Indexing** for fast queries
- **Connection Pooling** for database efficiency
- **Asset Optimization** with Vite bundling
- **Gzip Compression** for reduced bandwidth
- **CDN-Ready** static asset serving

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify network connectivity

2. **Redis Connection Failed**
   - Check REDIS_URL in .env
   - Ensure Redis instance is accessible
   - Verify authentication credentials

3. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify Socket.IO client/server versions
   - Check network/firewall settings

4. **Email Notifications Not Working**
   - Verify SENDGRID_API_KEY
   - Check SendGrid account status
   - Verify sender email verification

### Debug Mode
```bash
# Enable debug logging
DEBUG=kanban:* npm run dev
```

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables for production
- [ ] Configure production database
- [ ] Set up Redis instance
- [ ] Configure SendGrid
- [ ] Update CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up SSL certificates
- [ ] Test all features in production

### Render.com Deployment
1. Fork this repository
2. Connect to Render.com
3. Create new Web Service
4. Select Docker deployment
5. Set environment variables
6. Deploy!

## 📝 API Documentation

The backend provides a RESTful API with the following endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Boards
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Cards & Columns
- `POST /api/boards/:boardId/columns` - Create column
- `POST /api/boards/:boardId/columns/:columnId/cards` - Create card
- `PUT /api/boards/:boardId/cards/:cardId/move` - Move card

### Real-time Events (Socket.IO)
- `board:join` - Join board room
- `card:update` - Real-time card updates
- `typing:start/stop` - Typing indicators
- `presence:update` - User presence

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section
- Review the API documentation

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular project management tools
- Thanks to the open-source community

---

**Made with ❤️ for productive teams everywhere!**
