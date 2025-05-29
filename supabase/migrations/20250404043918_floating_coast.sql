/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies for profiles table
    - Create new comprehensive RLS policies that properly handle:
      - Profile creation for authenticated users
      - Profile reading for authenticated users
      - Profile updates for authenticated users
  
  2. Security
    - Enable RLS on profiles table
    - Add policies to ensure users can only:
      - Create their own profile
      - Read their own profile
      - Update their own profile
*/

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "User profile access" ON profiles;
DROP POLICY IF EXISTS "User profile creation" ON profiles;
DROP POLICY IF EXISTS "User profile updates" ON profiles;

-- Create new policies
CREATE POLICY "Enable profile creation for authenticated users"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable profile reading for authenticated users"
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable profile updates for authenticated users"
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);