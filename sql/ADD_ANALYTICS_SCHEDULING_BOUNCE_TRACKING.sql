-- Enhanced Email System: Analytics, Scheduling, and Bounce Tracking
-- This migration adds tables and columns for:
-- 1. Email Analytics & Tracking (open rates, click rates)
-- 2. Scheduled Email Campaigns (schedule sends for later)
-- 3. Bounce & Invalid Email Handling (track and remove bad emails)

-- ============================================================================
-- ENHANCEMENT 1: SCHEDULED SENDS AND ANALYTICS FIELDS
-- ============================================================================

-- Update admin_notifications table with scheduling fields
ALTER TABLE public.admin_notifications 
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS scheduled_status VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring'
ADD COLUMN IF NOT EXISTS schedule_timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS open_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS spam_report_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribe_count INT DEFAULT 0;

-- Create index for scheduled sends
CREATE INDEX IF NOT EXISTS idx_admin_notifications_scheduled_time 
    ON public.admin_notifications(scheduled_time) 
    WHERE scheduled_status = 'scheduled';

-- ============================================================================
-- ENHANCEMENT 2: EMAIL OPEN TRACKING (Pixel-based)
-- ============================================================================

-- Table to track email opens using tracking pixels
CREATE TABLE IF NOT EXISTS public.email_open_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
    log_id UUID NOT NULL REFERENCES public.admin_notification_logs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    
    tracking_token VARCHAR(255) UNIQUE NOT NULL, -- Unique token for this email
    opened_count INT DEFAULT 0, -- Number of times opened
    first_opened_at TIMESTAMP,
    last_opened_at TIMESTAMP,
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    email_client VARCHAR(100), -- 'gmail', 'outlook', 'apple_mail', etc
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_open_tracking_notification 
    ON public.email_open_tracking(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_open_tracking_token 
    ON public.email_open_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_open_tracking_user 
    ON public.email_open_tracking(user_email);

-- ============================================================================
-- ENHANCEMENT 3: EMAIL CLICK TRACKING
-- ============================================================================

-- Table to track link clicks in emails
CREATE TABLE IF NOT EXISTS public.email_click_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
    log_id UUID NOT NULL REFERENCES public.admin_notification_logs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    
    tracking_token VARCHAR(255) NOT NULL, -- Links to open tracking
    link_url TEXT NOT NULL,
    link_text VARCHAR(255),
    click_count INT DEFAULT 0, -- Number of times this link was clicked
    first_clicked_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_click_tracking_notification 
    ON public.email_click_tracking(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_click_tracking_token 
    ON public.email_click_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_click_tracking_url 
    ON public.email_click_tracking(link_url);

-- ============================================================================
-- ENHANCEMENT 4: BOUNCE & INVALID EMAIL MANAGEMENT
-- ============================================================================

-- Table to track bounced and invalid email addresses
CREATE TABLE IF NOT EXISTS public.invalid_email_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    
    bounce_type VARCHAR(50) NOT NULL, -- 'hard_bounce', 'soft_bounce', 'complaint', 'invalid', 'manual_remove'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'restored'
    reason TEXT, -- Detailed reason for bounce
    
    notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE SET NULL,
    first_bounce_at TIMESTAMP,
    total_bounces INT DEFAULT 1,
    last_bounce_at TIMESTAMP,
    
    -- Bounce details
    smtp_error_code VARCHAR(20),
    smtp_error_message TEXT,
    
    -- When to restore (for soft bounces)
    marked_for_removal_at TIMESTAMP,
    marked_for_removal_reason TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invalid_email_addresses_user 
    ON public.invalid_email_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_invalid_email_addresses_email 
    ON public.invalid_email_addresses(email_address);
CREATE INDEX IF NOT EXISTS idx_invalid_email_addresses_bounce_type 
    ON public.invalid_email_addresses(bounce_type);
CREATE INDEX IF NOT EXISTS idx_invalid_email_addresses_status 
    ON public.invalid_email_addresses(status);

-- ============================================================================
-- ENHANCEMENT 5: EMAIL ANALYTICS DASHBOARD TABLE
-- ============================================================================

-- Pre-aggregated analytics for fast dashboard queries
CREATE TABLE IF NOT EXISTS public.email_analytics_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
    
    -- Basic counts
    total_sent INT DEFAULT 0,
    total_delivered INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    total_bounced INT DEFAULT 0,
    total_complained INT DEFAULT 0,
    
    -- Engagement metrics
    total_opened INT DEFAULT 0,
    unique_opens INT DEFAULT 0,
    open_rate DECIMAL(5, 2) DEFAULT 0.00, -- percentage
    
    total_clicks INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    click_rate DECIMAL(5, 2) DEFAULT 0.00, -- percentage
    click_through_rate DECIMAL(5, 2) DEFAULT 0.00, -- clicks / opens
    
    total_unsubscribes INT DEFAULT 0,
    total_complaints INT DEFAULT 0,
    
    -- Device breakdown
    opens_mobile INT DEFAULT 0,
    opens_desktop INT DEFAULT 0,
    opens_tablet INT DEFAULT 0,
    
    -- Email client breakdown
    opens_gmail INT DEFAULT 0,
    opens_outlook INT DEFAULT 0,
    opens_apple INT DEFAULT 0,
    opens_other INT DEFAULT 0,
    
    -- Time metrics
    avg_time_to_open VARCHAR(50), -- e.g., "2h 15m"
    avg_time_to_click VARCHAR(50),
    
    last_opened_at TIMESTAMP,
    last_clicked_at TIMESTAMP,
    
    snapshot_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_analytics_snapshot_notification 
    ON public.email_analytics_snapshot(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_snapshot_created 
    ON public.email_analytics_snapshot(created_at DESC);

-- ============================================================================
-- ENHANCEMENT 6: SCHEDULED SEND QUEUE (for processing scheduled emails)
-- ============================================================================

-- Queue for managing scheduled email sends
CREATE TABLE IF NOT EXISTS public.scheduled_send_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
    
    scheduled_time TIMESTAMP NOT NULL,
    scheduled_timezone VARCHAR(50),
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'cancelled'
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    
    error_message TEXT,
    next_retry_at TIMESTAMP,
    
    processed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_reason TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_send_queue_time 
    ON public.scheduled_send_queue(scheduled_time) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_send_queue_notification 
    ON public.scheduled_send_queue(notification_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_send_queue_status 
    ON public.scheduled_send_queue(status);

-- ============================================================================
-- ENHANCEMENT 7: UNSUBSCRIBE TRACKING
-- ============================================================================

-- Track unsubscribes
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    
    -- Subscription preferences
    unsubscribe_all BOOLEAN DEFAULT FALSE,
    unsubscribe_categories TEXT[], -- Categories they unsubscribed from
    unsubscribe_reason VARCHAR(255),
    
    unsubscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resubscribed_at TIMESTAMP,
    
    notification_id UUID REFERENCES public.admin_notifications(id) ON DELETE SET NULL, -- Which email triggered unsubscribe
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user 
    ON public.email_unsubscribes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email 
    ON public.email_unsubscribes(user_email);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_unsubscribed_at 
    ON public.email_unsubscribes(unsubscribed_at DESC);

-- ============================================================================
-- ENHANCEMENT 8: BOUNCE MANAGEMENT STORED PROCEDURES
-- ============================================================================

-- Function to auto-mark emails as invalid after 3 hard bounces
CREATE OR REPLACE FUNCTION mark_hard_bounced_emails_invalid()
RETURNS TABLE (marked_count INT) AS $$
BEGIN
    CREATE TEMP TABLE marked_emails AS
    SELECT DISTINCT iea.id
    FROM public.invalid_email_addresses iea
    WHERE iea.bounce_type = 'hard_bounce'
        AND iea.total_bounces >= 3
        AND iea.status = 'active';
    
    UPDATE public.invalid_email_addresses
    SET status = 'archived',
        updated_at = CURRENT_TIMESTAMP
    WHERE id IN (SELECT id FROM marked_emails);
    
    RETURN QUERY
    SELECT COUNT(*)::INT FROM marked_emails;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENHANCEMENT 9: EMAIL ANALYTICS CALCULATION FUNCTION
-- ============================================================================

-- Function to calculate analytics for a notification
CREATE OR REPLACE FUNCTION calculate_email_analytics(notification_uuid UUID)
RETURNS void AS $$
DECLARE
    v_total_sent INT;
    v_total_opened INT;
    v_unique_opens INT;
    v_total_clicks INT;
    v_unique_clicks INT;
    v_open_rate DECIMAL(5, 2);
    v_click_rate DECIMAL(5, 2);
    v_ctr DECIMAL(5, 2);
BEGIN
    -- Count sent emails
    SELECT COUNT(*) INTO v_total_sent
    FROM public.admin_notification_logs
    WHERE notification_id = notification_uuid AND status = 'sent';
    
    -- Count opens
    SELECT COUNT(*) INTO v_total_opened
    FROM public.email_open_tracking
    WHERE notification_id = notification_uuid;
    
    -- Count unique opens
    SELECT COUNT(DISTINCT user_email) INTO v_unique_opens
    FROM public.email_open_tracking
    WHERE notification_id = notification_uuid;
    
    -- Count clicks
    SELECT COUNT(*) INTO v_total_clicks
    FROM public.email_click_tracking
    WHERE notification_id = notification_uuid;
    
    -- Count unique clicks
    SELECT COUNT(DISTINCT user_email) INTO v_unique_clicks
    FROM public.email_click_tracking
    WHERE notification_id = notification_uuid;
    
    -- Calculate rates
    v_open_rate := CASE WHEN v_total_sent > 0 THEN (v_unique_opens * 100.0 / v_total_sent)::DECIMAL(5, 2) ELSE 0 END;
    v_click_rate := CASE WHEN v_total_sent > 0 THEN (v_unique_clicks * 100.0 / v_total_sent)::DECIMAL(5, 2) ELSE 0 END;
    v_ctr := CASE WHEN v_total_opened > 0 THEN (v_total_clicks * 100.0 / v_total_opened)::DECIMAL(5, 2) ELSE 0 END;
    
    -- Update main notification table
    UPDATE public.admin_notifications
    SET open_count = v_total_opened,
        click_count = v_total_clicks,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = notification_uuid;
    
    -- Insert or update analytics snapshot
    INSERT INTO public.email_analytics_snapshot (
        notification_id,
        total_sent,
        total_opened,
        unique_opens,
        open_rate,
        total_clicks,
        unique_clicks,
        click_rate,
        click_through_rate
    ) VALUES (
        notification_uuid,
        v_total_sent,
        v_total_opened,
        v_unique_opens,
        v_open_rate,
        v_total_clicks,
        v_unique_clicks,
        v_click_rate,
        v_ctr
    )
    ON CONFLICT (notification_id) DO UPDATE
    SET total_sent = v_total_sent,
        total_opened = v_total_opened,
        unique_opens = v_unique_opens,
        open_rate = v_open_rate,
        total_clicks = v_total_clicks,
        unique_clicks = v_unique_clicks,
        click_rate = v_click_rate,
        click_through_rate = v_ctr,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS for new tables
ALTER TABLE public.email_open_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invalid_email_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_send_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role (admin backend)
CREATE POLICY "Service role access" ON public.email_open_tracking 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON public.email_click_tracking 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON public.invalid_email_addresses 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON public.email_analytics_snapshot 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON public.scheduled_send_queue 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role access" ON public.email_unsubscribes 
    FOR ALL USING (auth.role() = 'service_role');

-- Done!
