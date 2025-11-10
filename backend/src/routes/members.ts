import { Router, Request, Response } from 'express';
import multer from 'multer';
import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';
import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, AdminGetUserCommand, ResendConfirmationCodeCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getUserByCognitoSub, createUser, linkUserToMember, updateUserOnboardingStatusByCognitoSub } from '../db/queries';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || '';

// Cognito SignUp endpoint
router.post('/cognito/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const command = new SignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
      ],
    });

    const response = await cognitoClient.send(command);
    
    res.json({
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito SignUp error:', error);
    if (error.name === 'UsernameExistsException') {
      return res.status(400).json({ 
        error: 'An account with this email already exists',
        code: 'USER_ALREADY_EXISTS'
      });
    }
    res.status(400).json({ 
      error: error.message || 'Failed to create account'
    });
  }
});

// Cognito ConfirmSignUp endpoint
router.post('/cognito/verify', async (req: Request, res: Response) => {
  try {
    const { email, code, cognito_sub } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const command = new ConfirmSignUpCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    const response = await cognitoClient.send(command);
    
    // Create or update user onboarding status to COGNITO_CONFIRMED if cognito_sub is provided
    if (cognito_sub) {
      try {
        let user = await getUserByCognitoSub(cognito_sub);
        if (!user) {
          // Create user record with COGNITO_CONFIRMED status
          await createUser({
            cognito_sub: cognito_sub,
            email: email,
            role: 'CONSUMER',
            onboarding_status: 'COGNITO_CONFIRMED',
          });
        } else {
          // Update existing user status
          await updateUserOnboardingStatusByCognitoSub(cognito_sub, 'COGNITO_CONFIRMED');
        }
      } catch (err) {
        console.error('Error creating/updating user onboarding status:', err);
        // Continue anyway - user creation is not critical for verification
      }
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Cognito ConfirmSignUp error:', error);
    res.status(400).json({ 
      error: error.name === 'CodeMismatchException'
        ? 'Invalid verification code'
        : error.message || 'Failed to verify account'
    });
  }
});

// Forgot Password endpoint
router.post('/cognito/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const command = new ForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    res.json({ 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito ForgotPassword error:', error);
    
    // Check if user exists but email is not verified
    if (error.name === 'InvalidParameterException' && 
        error.message?.includes('no registered/verified email')) {
      // Try to check if user exists
      try {
        const adminGetUserCommand = new AdminGetUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: req.body.email,
        });
        await cognitoClient.send(adminGetUserCommand);
        
        // User exists but email not verified
        return res.status(400).json({ 
          error: 'Your email address has not been verified. Please verify your email first or request a new verification code.',
          code: 'EMAIL_NOT_VERIFIED',
          canResendCode: true
        });
      } catch (adminError: any) {
        if (adminError.name === 'UserNotFoundException') {
          return res.status(400).json({ 
            error: 'No account found with this email address'
          });
        }
      }
    }
    
    res.status(400).json({ 
      error: error.name === 'UserNotFoundException'
        ? 'No account found with this email address'
        : error.message || 'Failed to send password reset code'
    });
  }
});

// Resend verification code endpoint
router.post('/cognito/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    res.json({ 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('Cognito ResendConfirmationCode error:', error);
    res.status(400).json({ 
      error: error.name === 'UserNotFoundException'
        ? 'No account found with this email address'
        : error.name === 'InvalidParameterException'
        ? 'This account may already be verified or does not exist'
        : error.message || 'Failed to resend verification code'
    });
  }
});

// Confirm Forgot Password endpoint
router.post('/cognito/confirm-forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const command = new ConfirmForgotPasswordCommand({
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(command);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Cognito ConfirmForgotPassword error:', error);
    res.status(400).json({ 
      error: error.name === 'CodeMismatchException'
        ? 'Invalid verification code'
        : error.name === 'ExpiredCodeException'
        ? 'Verification code has expired. Please request a new one.'
        : error.message || 'Failed to reset password'
    });
  }
});

// Save draft registration progress (incremental saves after Step 1)
router.post('/draft', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    const { cognito_sub, email } = req.body;

    if (!cognito_sub) {
      return res.status(400).json({ error: 'Cognito sub is required' });
    }

    // Check if draft already exists
    const existingDraft = await pool.query(
      'SELECT id FROM members WHERE cognito_sub = $1',
      [cognito_sub]
    );

    // Upload headshot to S3 if provided
    let headshotUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Parse form data
    const parsedData: any = {
      ...req.body,
      initiated_chapter_id: req.body.initiated_chapter_id ? parseInt(req.body.initiated_chapter_id) : null,
      initiated_season: req.body.initiated_season || null,
      initiated_year: req.body.initiated_year ? parseInt(req.body.initiated_year) : null,
      address_is_private: req.body.address_is_private === 'true' || req.body.address_is_private === true,
      phone_is_private: req.body.phone_is_private === 'true' || req.body.phone_is_private === true,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    };

    if (existingDraft.rows.length > 0) {
      // Update existing draft
      const updateFields: string[] = [];
      const values: any[] = [cognito_sub];
      let paramCount = 1;

      if (parsedData.name) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        values.push(parsedData.name);
      }
      if (parsedData.membership_number) {
        paramCount++;
        updateFields.push(`membership_number = $${paramCount}`);
        values.push(parsedData.membership_number);
      }
      if (parsedData.initiated_chapter_id) {
        paramCount++;
        updateFields.push(`initiated_chapter_id = $${paramCount}`);
        values.push(parsedData.initiated_chapter_id);
      }
      if (parsedData.initiated_season !== undefined) {
        paramCount++;
        updateFields.push(`initiated_season = $${paramCount}`);
        values.push(parsedData.initiated_season);
      }
      if (parsedData.initiated_year !== undefined) {
        paramCount++;
        updateFields.push(`initiated_year = $${paramCount}`);
        values.push(parsedData.initiated_year);
      }
      if (parsedData.ship_name !== undefined) {
        paramCount++;
        updateFields.push(`ship_name = $${paramCount}`);
        values.push(parsedData.ship_name);
      }
      if (parsedData.line_name !== undefined) {
        paramCount++;
        updateFields.push(`line_name = $${paramCount}`);
        values.push(parsedData.line_name);
      }
      if (parsedData.location !== undefined) {
        paramCount++;
        updateFields.push(`location = $${paramCount}`);
        values.push(parsedData.location);
      }
      if (parsedData.address !== undefined) {
        paramCount++;
        updateFields.push(`address = $${paramCount}`);
        values.push(parsedData.address);
      }
      if (parsedData.address_is_private !== undefined) {
        paramCount++;
        updateFields.push(`address_is_private = $${paramCount}`);
        values.push(parsedData.address_is_private);
      }
      if (parsedData.phone_number !== undefined) {
        paramCount++;
        updateFields.push(`phone_number = $${paramCount}`);
        values.push(parsedData.phone_number);
      }
      if (parsedData.phone_is_private !== undefined) {
        paramCount++;
        updateFields.push(`phone_is_private = $${paramCount}`);
        values.push(parsedData.phone_is_private);
      }
      if (parsedData.industry !== undefined) {
        paramCount++;
        updateFields.push(`industry = $${paramCount}`);
        values.push(parsedData.industry);
      }
      if (parsedData.job_title !== undefined) {
        paramCount++;
        updateFields.push(`job_title = $${paramCount}`);
        values.push(parsedData.job_title);
      }
      if (parsedData.bio !== undefined) {
        paramCount++;
        updateFields.push(`bio = $${paramCount}`);
        values.push(parsedData.bio);
      }
      if (headshotUrl) {
        paramCount++;
        updateFields.push(`headshot_url = $${paramCount}`);
        values.push(headshotUrl);
      }
      if (parsedData.social_links) {
        paramCount++;
        updateFields.push(`social_links = $${paramCount}`);
        values.push(JSON.stringify(parsedData.social_links));
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const result = await pool.query(
        `UPDATE members SET ${updateFields.join(', ')} WHERE cognito_sub = $1 RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } else {
      // Create new draft (requires at least email and cognito_sub)
      if (!email) {
        return res.status(400).json({ error: 'Email is required for new draft' });
      }

      // Build dynamic INSERT query - only include fields that have values
      const fields: string[] = ['email', 'cognito_sub', 'registration_status'];
      const values: any[] = [email, cognito_sub, 'DRAFT'];
      let paramCount = 3;

      // Only add fields that have actual values (not null/empty)
      if (parsedData.name) {
        fields.push('name');
        values.push(parsedData.name);
        paramCount++;
      }
      if (parsedData.membership_number) {
        fields.push('membership_number');
        values.push(parsedData.membership_number);
        paramCount++;
      }
      if (parsedData.initiated_chapter_id) {
        fields.push('initiated_chapter_id');
        values.push(parsedData.initiated_chapter_id);
        paramCount++;
      }
      if (parsedData.initiated_season) {
        fields.push('initiated_season');
        values.push(parsedData.initiated_season);
        paramCount++;
      }
      if (parsedData.initiated_year) {
        fields.push('initiated_year');
        values.push(parsedData.initiated_year);
        paramCount++;
      }
      if (parsedData.ship_name) {
        fields.push('ship_name');
        values.push(parsedData.ship_name);
        paramCount++;
      }
      if (parsedData.line_name) {
        fields.push('line_name');
        values.push(parsedData.line_name);
        paramCount++;
      }
      if (parsedData.location) {
        fields.push('location');
        values.push(parsedData.location);
        paramCount++;
      }
      if (parsedData.address !== undefined && parsedData.address !== null && parsedData.address !== '') {
        fields.push('address');
        values.push(parsedData.address);
        paramCount++;
      }
      fields.push('address_is_private');
      values.push(parsedData.address_is_private || false);
      paramCount++;
      if (parsedData.phone_number) {
        fields.push('phone_number');
        values.push(parsedData.phone_number);
        paramCount++;
      }
      fields.push('phone_is_private');
      values.push(parsedData.phone_is_private || false);
      paramCount++;
      if (parsedData.industry) {
        fields.push('industry');
        values.push(parsedData.industry);
        paramCount++;
      }
      if (parsedData.job_title) {
        fields.push('job_title');
        values.push(parsedData.job_title);
        paramCount++;
      }
      if (parsedData.bio) {
        fields.push('bio');
        values.push(parsedData.bio);
        paramCount++;
      }
      if (headshotUrl) {
        fields.push('headshot_url');
        values.push(headshotUrl);
        paramCount++;
      }
      fields.push('social_links');
      values.push(JSON.stringify(parsedData.social_links || {}));
      paramCount++;

      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO members (${fields.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values
      );

      // Update user onboarding status to ONBOARDING_STARTED when they start filling out the form
      if (cognito_sub) {
        try {
          await updateUserOnboardingStatusByCognitoSub(cognito_sub, 'ONBOARDING_STARTED');
        } catch (err) {
          // User might not exist yet, that's okay
          console.log('User not found for onboarding status update:', err);
        }
      }

      res.json(result.rows[0]);
    }
  } catch (error: any) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Get draft registration by cognito_sub
router.get('/draft/:cognitoSub', async (req: Request, res: Response) => {
  try {
    const { cognitoSub } = req.params;

    const result = await pool.query(
      'SELECT * FROM members WHERE cognito_sub = $1 AND registration_status = $2',
      [cognitoSub, 'DRAFT']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const member = result.rows[0];
    if (member.social_links && typeof member.social_links === 'string') {
      member.social_links = JSON.parse(member.social_links);
    }

    res.json(member);
  } catch (error: any) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

const memberRegistrationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  membership_number: z.string().min(1),
  cognito_sub: z.string().optional(), // Cognito user ID
  initiated_chapter_id: z.number().int().positive(),
  initiated_season: z.string().optional().nullable(),
  initiated_year: z.number().int().positive().optional().nullable(),
  ship_name: z.string().optional().nullable(),
  line_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  address_is_private: z.boolean().default(false),
  phone_number: z.string().optional().nullable(),
  phone_is_private: z.boolean().default(false),
  industry: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  social_links: z.record(z.string()).optional(),
});

router.post('/register', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    // Parse form data first
    const parsedBody = {
      ...req.body,
      initiated_chapter_id: parseInt(req.body.initiated_chapter_id),
      initiated_season: req.body.initiated_season || null,
      initiated_year: req.body.initiated_year ? parseInt(req.body.initiated_year) : null,
      address_is_private: req.body.address_is_private === 'true' || req.body.address_is_private === true,
      phone_is_private: req.body.phone_is_private === 'true' || req.body.phone_is_private === true,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
      cognito_sub: req.body.cognito_sub || null,
    };

    // Validate request body
    const body = memberRegistrationSchema.parse(parsedBody);

    // Check if member already exists
    const existingMember = await pool.query(
      'SELECT id FROM sellers WHERE email = $1 OR membership_number = $2 UNION SELECT id FROM promoters WHERE email = $1 OR membership_number = $2 UNION SELECT id FROM members WHERE email = $1 OR membership_number = $2',
      [body.email, body.membership_number]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'A member with this email or membership number already exists' });
    }

    // Upload headshot to S3
    let headshotUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Check if draft exists and update it, or create new complete registration
    const existingDraft = await pool.query(
      'SELECT id FROM members WHERE cognito_sub = $1',
      [body.cognito_sub]
    );

    let result;
    if (existingDraft.rows.length > 0) {
      // Update existing draft to complete
      result = await pool.query(
        `UPDATE members SET
          name = $1, email = $2, membership_number = $3, initiated_chapter_id = $4,
          initiated_season = $5, initiated_year = $6, ship_name = $7, line_name = $8,
          location = $9, address = $10, address_is_private = $11, phone_number = $12, phone_is_private = $13,
          industry = $14, job_title = $15, bio = $16, headshot_url = $17, social_links = $18,
          registration_status = 'COMPLETE', updated_at = CURRENT_TIMESTAMP
        WHERE cognito_sub = $19
        RETURNING *`,
        [
          body.name,
          body.email,
          body.membership_number,
          body.initiated_chapter_id,
          body.initiated_season || null,
          body.initiated_year || null,
          body.ship_name || null,
          body.line_name || null,
          body.location || null,
          body.address || null,
          body.address_is_private,
          body.phone_number || null,
          body.phone_is_private,
          body.industry || null,
          body.job_title || null,
          body.bio || null,
          headshotUrl || null,
          JSON.stringify(body.social_links || {}),
          body.cognito_sub,
        ]
      );
    } else {
      // Create new complete registration
      result = await pool.query(
        `INSERT INTO members (
          name, email, membership_number, cognito_sub, initiated_chapter_id,
          initiated_season, initiated_year, ship_name, line_name,
          location, address, address_is_private, phone_number, phone_is_private,
          industry, job_title, bio, headshot_url, social_links, registration_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'COMPLETE')
        RETURNING *`,
        [
          body.name,
          body.email,
          body.membership_number,
          body.cognito_sub || null,
          body.initiated_chapter_id,
          body.initiated_season || null,
          body.initiated_year || null,
          body.ship_name || null,
          body.line_name || null,
          body.location || null,
          body.address || null,
          body.address_is_private,
          body.phone_number || null,
          body.phone_is_private,
          body.industry || null,
          body.job_title || null,
          body.bio || null,
          headshotUrl || null,
          JSON.stringify(body.social_links || {}),
        ]
      );
    }

    const member = result.rows[0];

    // Create or update user record and link to member
    if (body.cognito_sub) {
      try {
        let user = await getUserByCognitoSub(body.cognito_sub);
        if (!user) {
          // Create new user record
          user = await createUser({
            cognito_sub: body.cognito_sub,
            email: body.email,
            role: 'CONSUMER',
            onboarding_status: 'ONBOARDING_FINISHED',
            member_id: member.id,
          });
        } else {
          // Link existing user to member and update onboarding status
          await linkUserToMember(user.id, member.id);
          await updateUserOnboardingStatusByCognitoSub(body.cognito_sub, 'ONBOARDING_FINISHED');
        }
      } catch (userError) {
        console.error('Error creating/linking user record:', userError);
        // Don't fail the registration if user creation fails
      }
    }

    res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating member registration:', error);
    res.status(500).json({ error: 'Failed to create member registration' });
  }
});

export default router;

