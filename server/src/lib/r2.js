// Cloudflare R2 upload helper (S3-compatible API)
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { randomUUID } = require('crypto')
const path = require('path')

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

/**
 * Upload a file buffer to R2
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} originalname
 * @param {string} [subfolder]  e.g. 'orders' | 'stage-images'
 * @returns {Promise<string>} public URL
 */
const uploadToR2 = async (buffer, mimetype, originalname, subfolder = 'uploads') => {
  const env    = process.env.APP_ENV || 'local'
  const ext    = path.extname(originalname) || ''
  const key    = `${env}/${subfolder}/${Date.now()}-${randomUUID()}${ext}`

  await r2.send(new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME,
    Key:         key,
    Body:        buffer,
    ContentType: mimetype,
  }))

  return `${process.env.R2_PUBLIC_URL}/${key}`
}

/**
 * Delete a file from R2 by its public URL
 * @param {string} url
 */
const deleteFromR2 = async (url) => {
  const publicUrl = process.env.R2_PUBLIC_URL || ''
  const key = url.replace(publicUrl + '/', '')
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key:    key,
  }))
}

module.exports = { uploadToR2, deleteFromR2 }
