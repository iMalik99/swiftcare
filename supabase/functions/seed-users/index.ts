import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  email: string
  password: string
  fullName: string
  phone: string
  role: 'admin' | 'driver'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Define test users
    const users: UserData[] = [
      // 3 Admins
      { email: 'admin@swiftcare.ng', password: 'Admin123!', fullName: 'Admin One', phone: '+234801000001', role: 'admin' },
      { email: 'admin2@swiftcare.ng', password: 'Admin123!', fullName: 'Admin Two', phone: '+234801000002', role: 'admin' },
      { email: 'admin3@swiftcare.ng', password: 'Admin123!', fullName: 'Admin Three', phone: '+234801000003', role: 'admin' },
      // 10 Drivers
      { email: 'driver1@swiftcare.ng', password: 'Driver123!', fullName: 'Chukwu Emmanuel', phone: '+234802000001', role: 'driver' },
      { email: 'driver2@swiftcare.ng', password: 'Driver123!', fullName: 'Amina Yusuf', phone: '+234802000002', role: 'driver' },
      { email: 'driver3@swiftcare.ng', password: 'Driver123!', fullName: 'Tunde Okonkwo', phone: '+234802000003', role: 'driver' },
      { email: 'driver4@swiftcare.ng', password: 'Driver123!', fullName: 'Fatima Ibrahim', phone: '+234802000004', role: 'driver' },
      { email: 'driver5@swiftcare.ng', password: 'Driver123!', fullName: 'Olumide Adeyemi', phone: '+234802000005', role: 'driver' },
      { email: 'driver6@swiftcare.ng', password: 'Driver123!', fullName: 'Blessing Eze', phone: '+234802000006', role: 'driver' },
      { email: 'driver7@swiftcare.ng', password: 'Driver123!', fullName: 'Musa Abdullahi', phone: '+234802000007', role: 'driver' },
      { email: 'driver8@swiftcare.ng', password: 'Driver123!', fullName: 'Chioma Nwosu', phone: '+234802000008', role: 'driver' },
      { email: 'driver9@swiftcare.ng', password: 'Driver123!', fullName: 'Yakubu Garba', phone: '+234802000009', role: 'driver' },
      { email: 'driver10@swiftcare.ng', password: 'Driver123!', fullName: 'Ngozi Okeke', phone: '+234802000010', role: 'driver' },
    ]

    const results: { email: string; status: string; error?: string }[] = []

    for (const userData of users) {
      try {
        // Create user with admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
        })

        if (authError) {
          if (authError.message.includes('already been registered')) {
            results.push({ email: userData.email, status: 'already exists' })
            continue
          }
          throw authError
        }

        const userId = authData.user.id

        // Create profile
        await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userId,
            full_name: userData.fullName,
            phone: userData.phone,
          })

        // Assign role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userData.role,
          })

        results.push({ email: userData.email, status: 'created' })
      } catch (error) {
        results.push({ 
          email: userData.email, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Also create some ambulances if none exist
    const { data: existingAmbulances } = await supabaseAdmin
      .from('ambulances')
      .select('id')
      .limit(1)

    if (!existingAmbulances || existingAmbulances.length === 0) {
      const ambulances = [
        { plate_number: 'ABJ-001-SC', current_lat: 9.0765, current_lng: 7.3986 },
        { plate_number: 'ABJ-002-SC', current_lat: 9.0579, current_lng: 7.4951 },
        { plate_number: 'ABJ-003-SC', current_lat: 9.0820, current_lng: 7.5350 },
        { plate_number: 'ABJ-004-SC', current_lat: 9.0300, current_lng: 7.4800 },
        { plate_number: 'ABJ-005-SC', current_lat: 9.1000, current_lng: 7.4200 },
      ]

      await supabaseAdmin.from('ambulances').insert(ambulances)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Seed completed',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
