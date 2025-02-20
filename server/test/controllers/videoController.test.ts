import { describe, test, expect, mock, beforeEach } from "bun:test";
import { videoController } from "../../src/controllers/videoController.js";
import { videoService } from "../../src/services/videoService.js";
import { videoValidation } from "../../src/utils/videoValidation.js";
import log from "../../src/config/logger";

describe("Video Controller", () => {
  let mockContext;
  let mockFile;
  let uploadVideoMock;
  let validateVideoMock;
  let logMock;

  beforeEach(() => {
    // Reset all mocks before each test
    mockFile = new File(["test"], "test.mp4", { type: "video/mp4" });
    
    // Mock the video service
    uploadVideoMock = mock(() => 
      Promise.resolve({ 
        id: 1, 
        file_name: "test_video.mp4",
        file_path: "/uploads/test_video.mp4" 
      })
    );
    videoService.uploadVideo = uploadVideoMock;

    // Mock validation
    validateVideoMock = mock(() => ({ isValid: true }));
    videoValidation.validateVideo = validateVideoMock;

    // Mock logger
    logMock = {
      warn: mock(() => {}),
      error: mock(() => {}),
      info: mock(() => {})
    };
    Object.assign(log, logMock);

    mockContext = {
      req: {
        parseBody: mock(() => Promise.resolve({ video: mockFile }))
      },
      // Track the last response for assertions
      _response: { status: 200, data: {} },
      json: function(data: any, status?: number) {
        this._response = { status: status || 200, data };
        return this;
      }
    };
  });

  test("successful upload", async () => {
    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(200);
    expect(mockContext._response.data.success).toBe(true);
    expect(mockContext._response.data.data.file_name).toBe("test_video.mp4");
    expect(logMock.info).toHaveBeenCalled();
  });

  test("no file provided", async () => {
    mockContext.req.parseBody = mock(() => Promise.resolve({}));
    
    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(400);
    expect(mockContext._response.data.error).toBe("No file provided");
    expect(logMock.warn).toHaveBeenCalledWith("Upload attempted with no file");
  });

  test("validation failure", async () => {
    // Override validation mock to fail
    videoValidation.validateVideo = mock(() => ({
      isValid: false,
      error: "Invalid file type"
    }));

    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(400);
    expect(mockContext._response.data.error).toBe("Invalid file type");
    expect(logMock.warn).toHaveBeenCalled();
  });

  test("service error handling", async () => {
    // Override service mock to throw error
    videoService.uploadVideo = mock(() => {
      throw new Error("Upload failed");
    });

    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(500);
    expect(mockContext._response.data.success).toBe(false);
    expect(mockContext._response.data.error).toBe("Failed to upload video. Please try again.");
    expect(logMock.error).toHaveBeenCalled();
  });

  test("non-Error object thrown", async () => {
    // Override service mock to throw string
    videoService.uploadVideo = mock(() => {
      throw "Unexpected error";
    });

    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(500);
    expect(mockContext._response.data.success).toBe(false);
    expect(mockContext._response.data.error).toBe("Failed to upload video. Please try again.");
    expect(logMock.error).toHaveBeenCalledWith(
      "Video upload failed",
      expect.objectContaining({
        error: "Unexpected error"
      })
    );
  });

  test("parseBody error handling", async () => {
    mockContext.req.parseBody = mock(() => {
      throw new Error("Parse failed");
    });

    await videoController.upload(mockContext);
    
    expect(mockContext._response.status).toBe(500);
    expect(mockContext._response.data.success).toBe(false);
    expect(logMock.error).toHaveBeenCalled();
  });
})
