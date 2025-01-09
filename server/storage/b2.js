import B2 from 'backblaze-b2';

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

let authorized = false;

async function ensureAuthorized() {
  if (!authorized) {
    await b2.authorize();
    authorized = true;
  }
}

export async function uploadToB2(buffer, fileName, contentType) {
  try {
    await ensureAuthorized();

    const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID
    });

    const response = await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName,
      data: buffer,
      contentType
    });

    return response.data;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw error;
  }
}

export async function getFileFromB2(fileName) {
  try {
    await ensureAuthorized();

    const response = await b2.downloadFileByName({
      bucketName: process.env.B2_BUCKET_NAME,
      fileName: fileName,
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (error) {
    console.error('B2 download error:', error);
    throw error;
  }
}