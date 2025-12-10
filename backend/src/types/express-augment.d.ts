declare namespace Express {
  // Augment the User interface (used by req.user)
  interface User {
    id: string;
    _id: string;
    role: string;
    name?: string;
    email?: string;
    photo?: string;
  }

  // Augment Request if needed, but User augmentation is usually sufficient for req.user
  interface Request {
    requestTime?: string;
    querySearch?: Record<string, unknown>;
    user: User;
  }
}
