-- Admin Notifications System
-- This table stores all email notifications sent by admins to users

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    
    -- Notification details
    notification_type VARCHAR(50) NOT NULL, -- 'update', 'new_feature', 'system_downtime', 'congratulation', 'general'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    html_content TEXT, -- Optional rich HTML version of the message
    
    -- Recipient information
    recipient_type VARCHAR(50) NOT NULL, -- 'all_users', 'specific_users', 'by_role', 'by_tier'
    recipient_filter JSONB, -- Stores filter criteria {'role': 'editor', 'tier': 'premium'} etc
    recipients_list TEXT, -- JSON array of user IDs/emails if specific users
    recipient_count INT DEFAULT 0, -- Total number of recipients
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    
    -- Delivery metrics
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    bounce_count INT DEFAULT 0,
    
    -- Metadata
    tags TEXT[], -- Array of tags: ['update', 'urgent', 'marketing'] etc
    is_urgent BOOLEAN DEFAULT FALSE,
    track_opens BOOLEAN DEFAULT FALSE,
    track_clicks BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to track individual email delivery status
CREATE TABLE IF NOT EXISTS public.admin_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    
    status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'failed', 'bounced', 'opened', 'clicked'
    sent_at TIMESTAMP,
    error_message TEXT,
    
    -- Tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table to store email templates for quick reuse
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- 'updates', 'features', 'downtime', 'congratulation', 'custom'
    description TEXT,
    
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,
    
    variables JSONB, -- {'{{username}}': 'User name', '{{date}}': 'Scheduled date'}
    is_public BOOLEAN DEFAULT TRUE, -- Whether other admins can use this template
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_by ON public.admin_notifications(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON public.admin_notification_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.admin_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.admin_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.admin_notification_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON public.email_templates(created_by);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage notifications (but service role bypasses RLS)
CREATE POLICY "Service role can do anything" 
    ON public.admin_notifications 
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all notifications" 
    ON public.admin_notifications 
    FOR SELECT 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins can create notifications" 
    ON public.admin_notifications 
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins can update notifications" 
    ON public.admin_notifications 
    FOR UPDATE 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins can delete notifications" 
    ON public.admin_notifications 
    FOR DELETE 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

-- Log policies - service role can do anything
CREATE POLICY "Service role logs" 
    ON public.admin_notification_logs 
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view notification logs" 
    ON public.admin_notification_logs 
    FOR SELECT 
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

-- Template policies - service role can do anything
CREATE POLICY "Service role templates" 
    ON public.email_templates 
    FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view templates" 
    ON public.email_templates 
    FOR SELECT 
    USING (auth.role() = 'service_role' OR is_public OR created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins can create templates" 
    ON public.email_templates 
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins can update own templates" 
    ON public.email_templates 
    FOR UPDATE 
    USING (auth.role() = 'service_role' OR created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));
