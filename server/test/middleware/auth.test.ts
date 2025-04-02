import { expect, test, describe, beforeEach, mock } from "bun:test";
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from "../../src/middleware/auth.js";

// Mock the logger module
mock.module('../../src/config/logger.js', () => ({
  default: {
    error: mock(() => {}),
    warn: mock(() => {}),
    info: mock(() => {}),
    http: mock(() => {}),
    debug: mock(() => {})
  }
}));

describe('authMiddleware', () => {
  let mockContext: any;
  let mockNext: any;
  const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

  beforeEach(() => {
    mockNext = mock(() => {});
    mockContext = {
      req: {
        header: mock(() => null)
      },
      json: mock(() => mockContext),
      set: mock(() => {})
    };
  });

  test('returns 401 if no authorization header', async () => {
    mockContext.req.header.mockImplementation(() => null);

    await authMiddleware(mockContext, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 if authorization header does not start with Bearer', async () => {
    mockContext.req.header.mockImplementation(() => 'NotBearer token');

    await authMiddleware(mockContext, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 if token is invalid', async () => {
    mockContext.req.header.mockImplementation(() => 'Bearer invalid-token');
    
    await authMiddleware(mockContext, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 if token is expired', async () => {
    // Create an expired token
    const mockUser = { userId: 1, email: 'test@test.com', role: 'user' };
    const expiredToken = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '-10s' });
    mockContext.req.header.mockImplementation(() => `Bearer ${expiredToken}`);
    
    await authMiddleware(mockContext, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('calls next and sets user if token is valid', async () => {
    const mockUser = { userId: 1, email: 'test@test.com', role: 'user' };
    mockContext.req.header.mockImplementation(() => 'Bearer valid-token');
    
    // Mock jwt.verify to return our mock user
    const originalVerify = jwt.verify;
    jwt.verify = mock(() => mockUser);

    await authMiddleware(mockContext, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('user', mockUser);
    expect(mockNext).toHaveBeenCalled();

    // Restore original jwt.verify
    jwt.verify = originalVerify;
  });

  test('sets the correct user information from a real token', async () => {
    // Create a real token with JWT
    const mockUser = { userId: 1, email: 'test@test.com', role: 'user' };
    const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '1h' });
    mockContext.req.header.mockImplementation(() => `Bearer ${token}`);
    
    await authMiddleware(mockContext, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('user', expect.objectContaining({
      userId: mockUser.userId,
      email: mockUser.email,
      role: mockUser.role
    }));
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('requireRole middleware', () => {
  let mockContext: any;
  let mockNext: any;

  beforeEach(() => {
    mockNext = mock(() => {});
    mockContext = {
      get: mock(() => ({})),
      json: mock(() => mockContext)
    };
  });

  test('allows access if user has the required role', async () => {
    const user = { userId: 1, username: 'admin', email: 'admin@test.com', role: 'admin' };
    mockContext.get.mockImplementation(() => user);
    
    const middleware = requireRole('admin');
    await middleware(mockContext, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
  });

  test('allows access if user is admin and any role is required', async () => {
    const user = { userId: 1, username: 'admin', email: 'admin@test.com', role: 'admin' };
    mockContext.get.mockImplementation(() => user);
    
    const middleware = requireRole('user');
    await middleware(mockContext, mockNext);
    
    expect(mockNext).toHaveBeenCalled();
  });

  test('denies access if user does not have the required role', async () => {
    const user = { userId: 2, username: 'user', email: 'user@test.com', role: 'user' };
    mockContext.get.mockImplementation(() => user);
    
    const middleware = requireRole('admin');
    await middleware(mockContext, mockNext);
    
    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' }, 403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
