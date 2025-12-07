import { settings } from '@config/settings';
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

const app: express.Application = express();

// CORS configuration - use settings.FRONTEND_URL for all origins
const corsOptions = {
  origin: settings.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

//middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(helmet());
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

//Routes
app.use(routes);

//For Views

//for other routes
app.all('*', notFound);

//errors handler
app.use(globalErrorHandler);

export default app;
