import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import appointmentRoutes from './appointment.routes.js';
import leadRoutes from './lead.routes.js';
import bedRoutes from './bed.routes.js';
import billingRoutes from './billing.routes.js';
import campaignRoutes from './campaign.routes.js';
import referralRoutes from './referral.routes.js';
import reportRoutes from './report.routes.js';
import settingsRoutes from './settings.routes.js';
import feedbackRoutes from './feedback.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { checkConnection } from '../config/db.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

const apiRouter = Router();

/**
 * Health check endpoint verifying API and Neon DB status
 */
apiRouter.get('/health', async (_req, res) => {
  const dbStatus = await checkConnection();

  const healthData = {
    service: 'Hospital CRM Enterprise API',
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Neon Serverless PostgreSQL (Raw SQL / No ORM)',
      ...dbStatus,
    },
  };

  const statusCode = dbStatus.connected ? HTTP_STATUS.OK : HTTP_STATUS.ACCEPTED;
  return ApiResponse.success(res, healthData, 'Health check passed', statusCode);
});

// Mount modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/leads', leadRoutes);
apiRouter.use('/beds', bedRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/referrals', referralRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;
