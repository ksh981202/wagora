import { DeleteObjectCommand, PutObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner'
import { createClient } from 'npm:@supabase/supabase-js'

const ADMIN_EMAIL = 'k981202@naver.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type PresignRequestBody = {
  fileName?: string
  contentType?: string
  operation?: 'upload' | 'delete'
}

function buildPublicUrl(publicBaseUrl: string, fileName: string) {
  const base = publicBaseUrl.replace(/\/$/, '')
  const path = fileName
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${base}/${path}`
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''

  if (!token) {
    return { ok: false, status: 401 }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 401 }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { ok: false, status: 401 }
  }

  if (data.user.email?.trim().toLowerCase() !== ADMIN_EMAIL) {
    return { ok: false, status: 403 }
  }

  return { ok: true, status: 200 }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const adminCheck = await verifyAdmin(req)
  if (!adminCheck.ok) {
    return jsonResponse({ error: '권한이 없습니다' }, adminCheck.status)
  }

  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
  const endpoint = Deno.env.get('R2_ENDPOINT')
  const bucketName = Deno.env.get('R2_BUCKET_NAME')
  const publicBaseUrl = Deno.env.get('R2_PUBLIC_URL')

  if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName || !publicBaseUrl) {
    return jsonResponse({ error: 'Missing R2 environment variables' }, 500)
  }

  let body: PresignRequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const fileName = body.fileName?.trim()
  const contentType = body.contentType?.trim()
  const operation = body.operation ?? 'upload'

  if (!fileName) {
    return jsonResponse({ error: 'fileName is required' }, 400)
  }

  if (operation === 'upload' && !contentType) {
    return jsonResponse({ error: 'contentType is required' }, 400)
  }

  if (operation !== 'upload' && operation !== 'delete') {
    return jsonResponse({ error: 'Unsupported operation' }, 400)
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  })

  if (operation === 'delete') {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    })
    const deleteUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    return jsonResponse({ deleteUrl })
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const publicUrl = buildPublicUrl(publicBaseUrl, fileName)

  return jsonResponse({ uploadUrl, publicUrl })
})
