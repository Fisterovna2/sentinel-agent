/**
 * OpenCV Vision Detector
 * Handles computer vision tasks for game object detection and tracking
 */

const cv = require('opencv4nodejs');
const fs = require('fs');
const path = require('path');

class OpenCVDetector {
  constructor(config = {}) {
    this.config = {
      cannyThreshold: 100,
      cannyLinkingThreshold: 50,
      contourMinArea: 500,
      ...config
    };
    this.logger = require('../utils/logger');
  }

  /**
   * Detect objects in a screenshot using edge detection
   * @param {string} imagePath - Path to screenshot
   * @returns {Promise<Array>} Array of detected objects
   */
  async detectObjects(imagePath) {
    try {
      const image = cv.imread(imagePath);
      const grayImage = cv.cvtColor(image, cv.COLOR_BGR2GRAY);
      
      // Apply Canny edge detection
      const edges = cv.Canny(grayImage, this.config.cannyThreshold, this.config.cannyLinkingThreshold);
      
      // Find contours
      const contours = cv.findContours(edges, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const objects = [];
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > this.config.contourMinArea) {
          const rect = cv.boundingRect(contour);
          objects.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            area: area,
            confidence: Math.min(area / 10000, 1.0)
          });
        }
      }
      
      this.logger.info(`Detected ${objects.length} objects`, { imagePath });
      image.release();
      grayImage.release();
      edges.release();
      
      return objects;
    } catch (error) {
      this.logger.error('Object detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Track object movement across frames
   * @param {Array<Object>} objects - Current frame objects
   * @param {Array<Object>} previousObjects - Previous frame objects
   * @returns {Array<Object>} Tracked objects with movement vectors
   */
  trackObjects(objects, previousObjects = []) {
    const tracked = [];
    
    for (const obj of objects) {
      let closestMatch = null;
      let minDistance = Infinity;
      
      for (const prevObj of previousObjects) {
        const distance = Math.sqrt(
          Math.pow(obj.x - prevObj.x, 2) + 
          Math.pow(obj.y - prevObj.y, 2)
        );
        
        if (distance < minDistance && distance < 50) {
          minDistance = distance;
          closestMatch = prevObj;
        }
      }
      
      tracked.push({
        ...obj,
        id: closestMatch ? closestMatch.id : Math.random(),
        movementX: closestMatch ? obj.x - closestMatch.x : 0,
        movementY: closestMatch ? obj.y - closestMatch.y : 0,
        isNew: !closestMatch
      });
    }
    
    return tracked;
  }

  /**
   * Pattern matching to find specific game elements
   * @param {string} screenshotPath - Path to screenshot
   * @param {string} templatePath - Path to template image
   * @returns {Promise<Object>} Match result with coordinates
   */
  async matchTemplate(screenshotPath, templatePath) {
    try {
      const image = cv.imread(screenshotPath);
      const template = cv.imread(templatePath);
      
      const result = cv.matchTemplate(image, template, cv.TM_CCOEFF_NORMED);
      const minMaxResult = cv.minMaxLoc(result);
      
      image.release();
      template.release();
      result.release();
      
      return {
        found: minMaxResult.maxVal > 0.8,
        confidence: minMaxResult.maxVal,
        position: {
          x: minMaxResult.maxLoc.x,
          y: minMaxResult.maxLoc.y
        }
      };
    } catch (error) {
      this.logger.error('Template matching failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Color-based object detection
   * @param {string} imagePath - Path to image
   * @param {Object} colorRange - { lower: [H,S,V], upper: [H,S,V] }
   * @returns {Promise<Array>} Array of detected color regions
   */
  async detectByColor(imagePath, colorRange) {
    try {
      const image = cv.imread(imagePath);
      const hsvImage = cv.cvtColor(image, cv.COLOR_BGR2HSV);
      
      const lower = cv.inRange(hsvImage, colorRange.lower, colorRange.upper);
      const contours = cv.findContours(lower, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const regions = [];
      for (let i = 0; i < contours.size(); i++) {
        const rect = cv.boundingRect(contours.get(i));
        regions.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
      
      image.release();
      hsvImage.release();
      lower.release();
      
      return regions;
    } catch (error) {
      this.logger.error('Color detection failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = OpenCVDetector;
