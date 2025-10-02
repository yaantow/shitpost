import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  // The credentials will be automatically loaded from environment variables
  // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
});

export async function uploadToS3(fileBuffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: 'ishitpost',
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    // Server-side encryption is enabled by default in the bucket
  });

  try {
    await s3Client.send(command);
    return `https://ishitpost.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: 'ishitpost',
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
} 