import { Request, Response } from 'express';
import * as AliExpress from '../services/AliExpressApi.service';

/**
 * Return the AliExpress OAuth consent URL. Returned as JSON (rather than a
 * redirect) because this endpoint is called with a JWT from the admin UI,
 * which then navigates the browser to the URL itself.
 */
export const authorize = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!AliExpress.isAliExpressConfigured()) {
      res.status(400).json({
        success: false,
        error: 'AliExpress APP_KEY / APP_SECRET are not configured on the server.',
      });
      return;
    }

    const url = AliExpress.buildAuthorizeUrl();
    res.json({ success: true, data: { url } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build authorize URL',
    });
  }
};

/**
 * OAuth callback: AliExpress redirects here with a `code`. This endpoint must be
 * public because the redirect happens in the admin's browser without our JWT.
 */
export const callback = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = (req.query.code as string) || '';
    if (!code) {
      res.status(400).send('Missing authorization code');
      return;
    }

    await AliExpress.exchangeCodeForToken(code);

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontend}/admin?aliexpress=connected`);
  } catch (error) {
    console.error('AliExpress OAuth callback error:', error);
    res
      .status(500)
      .send(
        `AliExpress authorization failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
  }
};

/**
 * Debug helper: return the AliExpress address tree for a given parent
 * (country code like "FR", or a province id). Used to discover the exact
 * province labels/ids AliExpress expects for order validation.
 */
export const addressTree = async (req: Request, res: Response): Promise<void> => {
  try {
    const parent = (req.query.parent as string) || 'FR';
    const language = (req.query.language as string) || 'en_US';
    const tree = await AliExpress.getAddressTree(parent, language);
    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch address tree',
    });
  }
};

/**
 * Report whether the AliExpress account is connected (admin dashboard badge).
 */
export const status = async (_req: Request, res: Response): Promise<void> => {
  try {
    const configured = AliExpress.isAliExpressConfigured();
    const connected = configured ? await AliExpress.hasValidAuthorization() : false;

    res.json({
      success: true,
      data: { configured, connected },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch AliExpress status',
    });
  }
};
