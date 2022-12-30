const MAX_TREES = 500;
const WOOD_COLOUR = "#b87541";
const NEEDLE_COLOUR = "#2aa21a";
// "default" key from data/keys.json
const DEFAULT_KEY = "DQLRtWT-g5uiUsrqNMbKNIWzpJBB7862mfNgt3L-WqE";

let numTrees = 0;
let requiredHeight = 0;

function setup() {
	createCanvas(windowWidth, windowHeight * 2);
	requiredHeight = windowHeight * 0.8;
	frameRate(30);
	noSmooth();
	noStroke();
	angleMode(RADIANS);
	getMessage(getURLParams().key).then(message => {
		console.log(message)
	});
	createForest();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	createForest();
}

function createForest() {
	randomSeed(0);
	background(255);
	numTrees = 0;
	loop();
}

function draw() {
	//createForest();
	//noLoop();
	const radians = random(TWO_PI);
	// Radial form for a squircle
	const minRadius = 1 / pow(1 - (1 / 2) * pow(sin(2 * radians), 2), 1 / 4);
	const radMod = abs(randomGaussian(0, 0.2));
	const initTreeX = (minRadius * 0.7 + radMod) * sin(radians);
	const initTreeY = (minRadius * 0.9 + radMod) * cos(radians);
	createTree((initTreeX + 1) / 2, (initTreeY + 1) / 2);
	if (++numTrees >= MAX_TREES) {
		noLoop();
	}
}

// Creates a tree with a starting point at:
// `(x * windowWidth, y * windowHeight)`
function createTree(x, y) {
	const trunk = {
		x: x * windowWidth,
		y: y * windowHeight,
		h: constrain(randomGaussian(50, 20), 10, 90),
	};

	fill(WOOD_COLOUR);
	triangle(trunk.x - trunk.h / 10, trunk.y + trunk.h, trunk.x + trunk.h / 10, trunk.y + trunk.h, trunk.x, trunk.y);

	const numBranches = max(1, int(randomGaussian(40, 7)));
	for (let i = 0; i < numBranches; ++i) {
		createBranch(trunk);
	}
}

function createBranch(trunk) {
	const d = random();
	const branch = {
		x: trunk.x,
		y: trunk.y + d * trunk.h,
		r: -random(PI),
		l: (d + random()) / 4 * trunk.h,
	};
	strokeWeight(d * 2);
	stroke(WOOD_COLOUR);
	line(branch.x, branch.y, branch.x + cos(branch.r) * branch.l, branch.y + sin(branch.r) * branch.l);
	noStroke();
	const numNeedles = max(1, int(randomGaussian(60, 10)));
	for (let i = 0; i < numNeedles; ++i) {
		createNeedle(branch);
	}
}

function createNeedle(branch) {
	const d = random();
	const needle = {
		x: branch.x + d * cos(branch.r) * branch.l,
		y: branch.y + d * sin(branch.r) * branch.l,
		r: random(TWO_PI),
		l: (1 + (d - 1) * branch.l) / 4,
	};
	strokeWeight(1);
	stroke(NEEDLE_COLOUR);
	line(needle.x, needle.y, needle.x + cos(needle.r) * needle.l, needle.y + sin(needle.r) * needle.l);
	noStroke();
}

// Converts a hex string into an ArrayBuffer, for example:
// `"0a10" => ["0a", "10"] => [10, 16]`
// The string must have an even length
function hexStringToArrayBuffer(string) {
	const data = new DataView(new ArrayBuffer(string.length / 2));
	for (let i = 0; i < string.length; i += 2) {
		data.setUint8(i / 2, parseInt(string.substring(i, i + 2), 16));
	}
	return data.buffer;
}

// Uses an AES-CTR key to decrypt a string encrypted with that same key
async function decryptString(key, string) {
	return new TextDecoder().decode(await crypto.subtle.decrypt(
		{
			name: "AES-CTR",
			length: 128,
			counter: new ArrayBuffer(16)
		},
		key,
		hexStringToArrayBuffer(string)
	));
}

// Uses the keyData to find and decrypt the appropriate encrypted message
async function getMessage(keyData) {
	if (!keyData) keyData = DEFAULT_KEY;
	const messages = await fetch("data/encrypted-messages.json",
		{
			method: "GET",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
		}).then(response => response.json())
		.then(json => {
			return json;
		});
	const key = await crypto.subtle.importKey(
		"jwk",
		{
			key_ops: ["encrypt", "decrypt"],
			ext: true,
			kty: "oct",
			k: keyData,
			alg: "A256CTR"
		},
		{name: "AES-CTR"},
		true,
		["encrypt", "decrypt"]
	)
	for (const [k, m] of Object.entries(messages)) {
		if (await decryptString(key, k) === keyData) {
			return await decryptString(key, m);
		}
	}

	return "Could not decrypt a message with your key. Contact Michael for a fix.";
}
