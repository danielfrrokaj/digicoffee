-- 0001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Venues Table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE venues IS 'Stores information about each restaurant or coffee shop location.';

-- Profiles Table (linking to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id), -- Can be NULL for super admins? Or should every staff be linked?
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'bartender')), -- Defined roles
    full_name TEXT,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE profiles IS 'Stores user profile information, role, and venue association, linked to Supabase Auth users.';

-- Ensure profiles are updated when auth.users are created (via Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role) -- Default role or require setting? Let's default to bartender for now.
  VALUES (new.id, 'bartender');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Tables within a Venue
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL, -- e.g., 'Table 5', 'Bar Seat 2'
    qr_code_url TEXT, -- URL embedded in the physical QR code for this table
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(venue_id, table_number)
);
COMMENT ON TABLE tables IS 'Represents physical tables within a venue, identified by number and linked via QR code.';

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT, -- e.g., 'Coffee', 'Pastries', 'Drinks'
    image_url TEXT,
    is_available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE products IS 'Menu items offered by a venue.';
CREATE INDEX idx_products_venue_id ON products(venue_id);


-- Guest Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES tables(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to the anonymous auth user
    expires_at TIMESTAMPTZ NOT NULL, -- e.g., now() + interval '3 minutes'
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'completed')),
    location_verified BOOLEAN DEFAULT false NOT NULL, -- Flag set by client if location check passed
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE sessions IS 'Represents temporary guest sessions initiated by scanning a table QR code.';
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_table_id ON sessions(table_id);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id), -- Each order belongs to a guest session
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE orders IS 'Represents customer orders placed during a session.';
CREATE INDEX idx_orders_venue_id_created_at ON orders(venue_id, created_at);
CREATE INDEX idx_orders_session_id ON orders(session_id);


-- Order Items Table (Junction table for Orders and Products)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id), -- Product doesn't get deleted if order item is removed
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase >= 0), -- Price when the order was placed
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE order_items IS 'Details the specific products included in an order.';
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id); 