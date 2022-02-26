// https://github.com/aws/aws-sdk-js-v3
// https://www.npmjs.com/package/graphql-upload
// https://sharp.pixelplumbing.com/
// https://www.ibm.com/docs/en/aspera-on-cloud?topic=resources-aws-s3-content-types

import path from "path";
import sharp from "sharp";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { randomBytes } from "crypto";
import { createReadStream, writeFileSync } from "fs";

// read env
const AWS_KEY_ID = String(process.env.AWS_KEY_ID);
const AWS_ACCESS_KEY = String(process.env.AWS_ACCESS_KEY);
const AWS_BUCKET_NAME = String(process.env.AWS_BUCKET_NAME);
const AWS_REGION = String(process.env.AWS_REGION);


const generateImage = (imgName: string, size: number): void => {

	/** create s3 client */
	const s3Client = new S3Client({
		region: AWS_REGION,
		apiVersion: '2006-03-01',
		credentials: {
			accessKeyId: AWS_KEY_ID,
			secretAccessKey: AWS_ACCESS_KEY
		}
	});

	/** files path */
	const bytes = randomBytes(4);
	const auxName = bytes.toString('hex');
	const imageName = `image-${auxName}-${size}x${size}.png`;
	const fileOriginPath = path.join(__dirname, 'imgs', 'originals', `${imgName}.jpeg`);
	const localDestinationPath = path.join(__dirname, 'imgs', 'edited', `image-${auxName}-${size}x${size}.png`);

	// final image buffers
	const buffers: Buffer[] = []

	// create graphql image stream
	const stream = createReadStream(fileOriginPath);

	// hook for each chunk add on buffer
	stream.on('data', async function (chunk: Buffer) {
		buffers.push(chunk);
	});
	
	// hook on finish chunk create a final buffer
	stream.on('end', async () => {
		console.timeEnd('generate');
		const buffer = Buffer.concat(buffers);
		
		// crop and edit image
		console.time('crop');
		const result = await sharp(buffer)
			.extract({ height: size, width: size, left: 80, top: 0 }) // crop positions
			.resize({ width: size, height: size })
			.png() // defines png as default out file
			.toBuffer();
		console.timeEnd('crop');

		// -------------------------------------------
		// write file on edited on local files folder
		writeFileSync(localDestinationPath, result);

		// -------------------------------------------
		// create command to upload file to s3
		const command = new PutObjectCommand({
			Key: imageName,
			Bucket: AWS_BUCKET_NAME,
			Body: result,
			ContentType: 'image/png'
		});

		// upload file to s3
		console.time('upload');
		const payload = await s3Client.send(command);

		// if you want to put image inside a folder on command Key add: folderName/imageName
		// fileUrl: https://{bucketName}.s3.amazonaws.com/{commandKey}
		console.timeEnd('upload');
		console.log('http status: ', payload.$metadata.httpStatusCode);
		
		const url = `https://${AWS_BUCKET_NAME}.s3.amazonaws.com/${imageName}`;
		console.log('URL: ', url);
		
	});
}
console.log('....');
console.time('all:process');
console.time('generate');

// read, crop, edit, save local and upload
generateImage('image-728x455', 400);

console.timeEnd('all:process');
