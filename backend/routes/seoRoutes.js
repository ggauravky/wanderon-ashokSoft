import express from 'express';
import { 
  getSitemapXml, getRobotsTxt, getSeoMetadataByPath 
} from '../controllers/seoController.js';

const router = express.Router();

// Public SEO Endpoints
router.get('/sitemap.xml', getSitemapXml);
router.get('/robots.txt', getRobotsTxt);
router.get('/meta', getSeoMetadataByPath);

export default router;
