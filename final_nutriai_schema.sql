-- NutriAI Database Schema
-- Generated from the updated Excel sheet

-- 1. Master Table (users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Onboarding (user_profiles)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    height_cm DECIMAL(5,2),
    current_weight_kg DECIMAL(5,2),
    targeted_weight_kg DECIMAL(5,2),
    
    gender VARCHAR(50),
    activity_level VARCHAR(50),
    primary_goal VARCHAR(50),
    daily_calorie_target INTEGER,
    
    health_issues TEXT,
    allergies TEXT,
    dietary_preference VARCHAR(50),
    
    meal_intake_per_day INTEGER,
    water_intake_litres DECIMAL(4,2),
    sleep_schedule VARCHAR(100),
    regional_culture VARCHAR(100),
    available_cooking_time VARCHAR(100),
    preferred_cooking_oil VARCHAR(100),
    grocery_budget VARCHAR(50),
    preferred_meal_location VARCHAR(100),
    main_carbs_source VARCHAR(100),
    occupation VARCHAR(100),
    
    profile_photo_url TEXT,
    phone_number VARCHAR(20),
    
    current_momentum_score INTEGER DEFAULT 0, -- NEW: Tracks their ongoing Habit/Momentum score
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Ingredient Master
CREATE TABLE ingredients_master (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Ingredient Preferences
CREATE TABLE user_ingredient_preferences (
    pref_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients_master(ingredient_id) ON DELETE CASCADE,
    preference_type VARCHAR(50), -- e.g., 'liked', 'disliked', 'allergic'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, ingredient_id)
);

-- 5. Subscriptions
CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(100), -- 'free', 'Student', 'Working Professional', 'gym'
    price_paid DECIMAL(10,2) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(50) NULL,
    payment_id VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Daily Tracking
CREATE TABLE daily_tracking (
    tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    total_calories_consumed INTEGER DEFAULT 0,
    total_protein DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0,
    total_fat DECIMAL(5,2) DEFAULT 0,
    water_intake_litres DECIMAL(4,2) DEFAULT 0,
    junk_score_avg DECIMAL(4,2) DEFAULT 0,
    surplus_or_deficit INTEGER,
    
    behaviour_summary TEXT,
    meal_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 7. Meal Logs
CREATE TABLE meal_logs (
    meal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tracking_id UUID REFERENCES daily_tracking(tracking_id) ON DELETE SET NULL,
    
    meal_type VARCHAR(50),
    meal_location VARCHAR(100),
    meal_timedate TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_items TEXT,
    
    calories INTEGER,
    protein_gm DECIMAL(5,2),
    carbs_gm DECIMAL(5,2),
    fat_gm DECIMAL(5,2),
    junk_score INTEGER,
    
    ai_insights TEXT,
    meal_photo_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Chat Logs
CREATE TABLE chat_logs (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    message_type VARCHAR(50), -- 'text', 'voice', 'image'
    user_message TEXT,
    ai_response TEXT,
    
    behaviour_summary TEXT,
    meal_context TEXT,
    
    image_url TEXT,
    audio_file_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Courses
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255),
    description TEXT,
    duration VARCHAR(100),
    price DECIMAL(10,2),
    payment_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Community
CREATE TABLE community_posts (
    community_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    post_type VARCHAR(100),
    content TEXT,
    image_url TEXT,
    
    likes_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Progress Log
CREATE TABLE progress_logs (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    logged_weight_kg DECIMAL(5,2) NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Monthly Reports
CREATE TABLE monthly_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    report_month VARCHAR(10), -- e.g., '2023-11'
    ai_sumarry_text TEXT,
    
    avg_junk_score DECIMAL(5,2),
    avg_daily_calories INTEGER,
    consistency_percentage DECIMAL(5,2),
    weight_change DECIMAL(5,2) NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, report_month)
);

-------------------------------------------------------
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-------------------------------------------------------

-- 1. Create the reusable function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Apply the trigger to all tables that have an 'updated_at' column
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_daily_tracking_modtime
    BEFORE UPDATE ON daily_tracking
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_community_posts_modtime
    BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
