const crypto = require("crypto");
const fs = require("fs");

const existingKeys = JSON.parse(fs.readFileSync("data/keys.json", 'utf8'));
const messages = JSON.parse(fs.readFileSync("data/messages.json", 'utf8'));
const encryptedMessages = {};

// Encryption keys associated with each name
const nameKeys = {};

// Encrypt a string using AES-GCM
// Returns a string of the bytes encoded in hex (2 chars/byte)
async function encryptString(key, string) {
	let encrypted = "";
	let data = new DataView(await crypto.subtle.encrypt(
		{
			name: "AES-CTR",
			length: 128,
			counter: new ArrayBuffer(16)
		},
		key,
		new TextEncoder().encode(string)
	));
	for (let i = 0; i < data.byteLength; ++i) {
		let byte = data.getUint8(i);
		if (byte < 16) encrypted += "0";
		encrypted += byte.toString(16);
	}
	return encrypted;
}

// Searches `data/keys.json` to see if there is an existing key, otherwise generates a new one
async function getKey(name) {
	if (existingKeys[name]) {
		// Key exists already, import it
		return crypto.subtle.importKey(
			"jwk",
			{
				key_ops: ["encrypt", "decrypt"],
				ext: true,
				kty: "oct",
				k: existingKeys[name],
				alg: "A256CTR"
			},
			{name: "AES-CTR"},
			true,
			["encrypt", "decrypt"]
		)
	} else {
		// Key does not yet exist, create new
		return crypto.subtle.generateKey(
			{name: "AES-CTR", length: 256},
			true,
			["encrypt", "decrypt"]
		)
	}
}

// async anonymous function lets me use top level await
(async () => {
	// Encrypt messages individually, using unique keys
	for (const [name, message] of Object.entries(messages)) {
		const key = await getKey(name);

		// This k value is the only unique part of the key, the rest is constant (for this method)
		const keyString = (await crypto.subtle.exportKey("jwk", key)).k
		encryptedMessages[await encryptString(key, keyString)] = await encryptString(key, message);
		nameKeys[name] = keyString;
	}

	fs.writeFileSync("data/encrypted-messages.json", JSON.stringify(encryptedMessages));
	fs.writeFileSync("data/keys.json", JSON.stringify(nameKeys, null, 4));
})();
