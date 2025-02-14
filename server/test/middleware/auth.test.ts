import { expect, test, describe, beforeEach, mock } from "bun:test";
import jwt from 'jsonwebtoken';
import { authMiddleware } from "../../src/middleware/auth.js";

describe('authMiddleware', () => {
  let mockContext: any;
  let mockNext: any;

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

  test('returns 401 if token is invalid', async () => {
    mockContext.req.header.mockImplementation(() => 'Bearer invalid-token');
    
    await authMiddleware(mockContext, mockNext);

    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('calls next and sets user if token is valid', async () => {
    const mockUser = { userId: 1, email: 'test@test.com', role: 'user' };
    mockContext.req.header.mockImplementation(() => 'Bearer valid-token');
    
    // Mock jwt.verify to return our mock user
    const originalVerify = jwt.verify;
    jwt.verify = () => mockUser as any;

    await authMiddleware(mockContext, mockNext);

    expect(mockContext.set).toHaveBeenCalledWith('user', mockUser);
    expect(mockNext).toHaveBeenCalled();

    // Restore original jwt.verify
    jwt.verify = originalVerify;
  });
});
