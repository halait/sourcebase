/*
exports.sendMail = functions.https.onRequest(async (request, response) => {
	const nodemailer = require("nodemailer");
	const transport = nodemailer.createTransport({
		host: "smtp.gmail.com",
		auth: {
			user: "vigress.info@gmail.com",
			pass: "6426519609foobarIsKing&"
		}
	});
	let info = await transport.sendMail({
		from: "John Smith <bbcisgreatest@outlook.com>",
		to: "halaitpuneet@yahoo.ca",
		subject: "Mail from contact page",
		text: JSON.stringify(request.body)
	});
	console.log("Message sent, id: " + info.messageID);
	response.redirect("/portfolio/");
});
*/

"use strict";
const functions = require('firebase-functions');
const admin = require("firebase-admin");
admin.initializeApp();

exports.receiveMail = functions.https.onRequest((req, res) => {
	admin.firestore().collection("mail").add(req.body).catch(() => {res.send("Something went wrong, try again later.");});
	const privatePkcs8 = Buffer.from([48,129,135,2,1,0,48,19,6,7,42,134,72,206,61,2,1,6,8,42,134,72,206,61,3,1,7,4,109,48,107,2,1,1,4,32,54,
		175,12,90,163,105,27,241,75,197,243,108,227,88,78,196,230,80,227,201,179,197,166,79,176,72,67,209,254,160,108,93,161,68,3,66,0,4,118,
		203,93,97,186,91,121,234,207,201,56,28,73,48,165,62,55,241,237,134,69,140,132,54,186,224,160,202,92,35,116,179,34,238,85,165,193,231,
		158,177,22,171,86,143,108,66,180,149,190,130,168,61,207,37,235,183,171,184,60,157,195,220,10,90]);
	const publicKeyBase64 = "BHbLXWG6W3nqz8k4HEkwpT438e2GRYyENrrgoMpcI3SzIu5VpcHnnrEWq1aPbEK0lb6CqD3PJeu3q7g8ncPcClo";
	const privatePem = "-----BEGIN PRIVATE KEY-----\n" + privatePkcs8.toString("base64") + "\n-----END PRIVATE KEY-----";
	const header = bufferToUrlBase64(Buffer.from(`{"typ":"JWT","alg":"ES256"}`));
	const data = bufferToUrlBase64(Buffer.from(JSON.stringify({
		aud: "https://fcm.googleapis.com",
		exp: Math.floor(Date.now() / 1000) + 43200,
		sub: "mailto:halaitpuneet@yahoo.ca"
	})));
	const unsignedToken = header + "." + data;
	const crypto = require("crypto");
	const signer = crypto.createSign("RSA-SHA256");
	signer.update(unsignedToken);
	//const privateKey = crypto.createPrivateKey({key: privatePkcs8, format: "der", type: "pkcs8"});
	const signedToken = base64ToUrl(signer.sign(privatePem, "base64"));
	const joseSign = derToJose(signedToken);
	const jwt = unsignedToken + "." + joseSign;
	const https = require("https");
	const subscriptions = [
		{
			endpoint: "https://fcm.googleapis.com/fcm/send/cOiy7lt2RXI:APA91bEbEiNSxB0ZcUT0H2fpWbajiQpMemTVu1YjNZmGDpgg5eAL55RkDA6v3i95GCC-5rYMYplsThKzhTjJhnWpiSk0BIddjDTQDkttmvdSr-av-TJPtprtACnZUK6bVTwdozwMGZ4K",
			path: "/fcm/send/cOiy7lt2RXI:APA91bEbEiNSxB0ZcUT0H2fpWbajiQpMemTVu1YjNZmGDpgg5eAL55RkDA6v3i95GCC-5rYMYplsThKzhTjJhnWpiSk0BIddjDTQDkttmvdSr-av-TJPtprtACnZUK6bVTwdozwMGZ4K",
			expirationTime: null,
			keys: {
				p256dh: "BPEjbnwiCv7a71kA-PWfRJlvEDVqAbqH550eH2FMz-a_5BnO0fNpMcXmgJSKeSqauN0ywOvj30Fc2YsgiC1s5Dk",
				auth: "aXFKYxP-curZ45kK9BI4PA"
			}
		},
		{
			path: "/fcm/send/fH4SVIg7UmM:APA91bF0PbnYiTXchqsXTBfa-8JLm7AymarfcpNmVw70DpmYuuWH2AHVRdYNNuKEE9gmW9hIPscLE-hRUBlRWylqca8-qWRJ7w_EyCQAm7eEfx_XOt72MiKYpcdB0O0wNi3xG82ol_aZ"
		}
	];

	const options = {
		hostname: "fcm.googleapis.com",
		path: "",
		method: "POST",
		headers: {
			"Authorization": "WebPush " + jwt,
			"Crypto-Key": "p256ecdsa=" + publicKeyBase64,
			"Content-Length": "0",
			"TTL": "2419200"
		}
	};

	const promises = [];
	for(let i = 0, len = subscriptions.length; i != len; ++i){
		promises.push(new Promise((resolve, reject) => {
			options.path = subscriptions[i].path;
			const pushRequest = https.request(options, (pushResponse) => {
				pushResponse.on("data", (d) => {
					process.stdout.write(d);
				});
				pushResponse.on("end", (e) => {
					resolve();
				});
			});
			pushRequest.on("error", (e) => {
				reject();
			});
			pushRequest.end();
		}));
	}
	Promise.all(promises)
		.then(() => {res.redirect("/thank-you/");})
		.catch(() => {res.send("Something went wrong, try again later.");});
});
// from npm module ecdsa-sig-formatter
function derToJose(signature){
	var MAX_OCTET = 0x80,
	CLASS_UNIVERSAL = 0,
	PRIMITIVE_BIT = 0x20,
	TAG_SEQ = 0x10,
	TAG_INT = 0x02,
	ENCODED_TAG_SEQ = (TAG_SEQ | PRIMITIVE_BIT) | (CLASS_UNIVERSAL << 6),
	ENCODED_TAG_INT = TAG_INT | (CLASS_UNIVERSAL << 6);

	signature = Buffer.from(signature, "base64");
	//var paramBytes = getParamBytesForAlg(alg);
	var paramBytes = 32;
	// the DER encoded param should at most be the param size, plus a padding
	// zero, since due to being a signed integer
	var maxEncodedParamLength = paramBytes + 1;

	var inputLength = signature.length;

	var offset = 0;
	if (signature[offset++] !== ENCODED_TAG_SEQ) {
		throw new Error('Could not find expected "seq"');
	}

	var seqLength = signature[offset++];
	if (seqLength === (MAX_OCTET | 1)) {
		seqLength = signature[offset++];
	}

	if (inputLength - offset < seqLength) {
		throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
	}

	if (signature[offset++] !== ENCODED_TAG_INT) {
		throw new Error('Could not find expected "int" for "r"');
	}

	var rLength = signature[offset++];

	if (inputLength - offset - 2 < rLength) {
		throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
	}

	if (maxEncodedParamLength < rLength) {
		throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
	}

	var rOffset = offset;
	offset += rLength;

	if (signature[offset++] !== ENCODED_TAG_INT) {
		throw new Error('Could not find expected "int" for "s"');
	}

	var sLength = signature[offset++];

	if (inputLength - offset !== sLength) {
		throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
	}

	if (maxEncodedParamLength < sLength) {
		throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
	}

	var sOffset = offset;
	offset += sLength;

	if (offset !== inputLength) {
		throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
	}

	var rPadding = paramBytes - rLength,
		sPadding = paramBytes - sLength;

	var dst = Buffer.allocUnsafe(rPadding + rLength + sPadding + sLength);

	for (offset = 0; offset < rPadding; ++offset) {
		dst[offset] = 0;
	}
	signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);

	offset = paramBytes;

	for (var o = offset; offset < o + sPadding; ++offset) {
		dst[offset] = 0;
	}
	signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
	//  offset = 32 , 
	return bufferToUrlBase64(dst);
}

function base64ToUrl(base64){
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function bufferToUrlBase64(buffer){
	return base64ToUrl(buffer.toString("base64"));
}