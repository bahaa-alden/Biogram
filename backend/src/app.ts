import { settings } from '@config/settings';
import swaggerSpec from '@config/swagger';
import { globalErrorHandler, notFound } from '@middlewares/error.middleware';
import JWTStrategy from '@middlewares/passport.config';
import { securityHeaders } from '@middlewares/security.middleware';
import routes from '@routes/index.routes';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  NextFunction,
  Request,
  Response,
  json,
  urlencoded,
} from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

const app: express.Application = express();

// CORS configuration - environment-based
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (settings.NODE_ENV === 'production') {
      // In production, only allow the frontend URL
      const allowedOrigins = settings.FRONTEND_URL 
        ? [settings.FRONTEND_URL] 
        : [];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

//middlewares
// Apply CORS before security headers to ensure preflight requests are handled
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(securityHeaders);
app.use(express.static(path.join(__dirname, '..', 'public')));
// Configure helmet to allow WebSocket connections and CORS
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP to avoid blocking WebSocket connections
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    xssFilter: false,
  })
);
if (settings.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.disable('x-powered-by');

// Rate limiting configuration
// const generalLimiter = rateLimit({
//   max: 100, // 100 requests
//   windowMs: 60 * 60 * 1000, // per hour
//   message: 'Too many requests from this IP, please try again in an hour!',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  max: 5, // 5 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
  message: 'Too many authentication attempts, please try again later!',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
// app.use('/api', generalLimiter);
app.use('/api/v1/users/login', authLimiter);
app.use('/api/v1/users/signup', authLimiter);
app.use('/api/v1/users/forgotPassword', authLimiter);
// Body parser with size limits
app.use(json({ limit: '10kb' }));
app.use(urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

app.use(passport.initialize());

passport.use('jwt', JWTStrategy);

app.use((req: Request, res: Response, next: NextFunction) => {
  (req as Request & { requestTime?: string }).requestTime =
    new Date().toISOString();
  next();
});

// Swagger Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Biogram API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  })
);

//Routes
app.use(routes);

//For Views

//for other routes
app.all('*', notFound);

//errors handler
app.use(globalErrorHandler);

export default app;
