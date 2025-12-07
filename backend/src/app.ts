import { settings } from '@config/settings';
import swaggerSpec from '@config/swagger';
import { globalErrorHandler, notFound } from '@middlewares/error.middleware';
import JWTStrategy from '@middlewares/passport.config';
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

// CORS configuration - allow all origins
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

//middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// app.use('/api', limiter);
app.use(json({ limit: '10kb' }));
app.use(urlencoded({ extended: false }));
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
