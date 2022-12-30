/// Some code from https://github.com/ren-yuan/c2.js/blob/main/examples%20for%20p5.js/Voronoi.js

// "default" key from data/keys.json
const DEFAULT_KEY = "DQLRtWT-g5uiUsrqNMbKNIWzpJBB7862mfNgt3L-WqE";
// Whether to adjust canvas size and matrix
let resetSize = true;
// Message to display
let message;
let agents = Array(5);
function setup() {
	createCanvas(windowWidth, windowHeight);
	angleMode(RADIANS);
	noLoop();
	for (let i = 0; i < agents.length; ++i) {
		agents[i] = new Array(20);
	}
	frameRate(30);
	for (const layer of agents) {
		for (let i = 0; i < layer.length; ++i) {
			layer[i] = new Agent();
		}
	}
	getMessage(getURLParams()["key"]).then(decrypted => {
		message = decrypted;
		console.log(message);
		loop();
	});
}

function windowResized() {
	resetSize = true;
}

function draw() {
	if (resetSize) {
		resizeCanvas(windowWidth, windowHeight);
		resetMatrix();
		applyMatrix(1, 0, 0, 1, windowWidth / 2, windowHeight / 2);
	}

	background("#006666")
	circle(0, 0, 10);

	let alpha = 1;
	const max = 2 * sqrt(width * width + height * height) / 2;
	const rect = new c2.Rect(-width / 2, -height / 2, width, height);
	noStroke();

	for (const layer of agents) {
		const voronoi = new c2.Voronoi();//Delaunay();//
		voronoi.compute(layer);
		alpha *= 0.1;
		for (let region of voronoi.regions) {//triangles) {//
			region = rect.clip(region);
			const c = region.centroid();
			fill(255 * pow(sqrt(c.x * c.x + c.y * c.y) / max, 3), 255 * (0.2 - alpha));
			//triangle(region.p1.x, region.p1.y, region.p2.x, region.p2.y, region.p3.x, region.p3.y);
			beginShape();
			for (const vert of region.vertices) vertex(vert.x, vert.y);
			endShape(CLOSE);
		}
		for (const agent of layer) {
			//circle(agent.x, agent.y, 10);
			agent.update()
		}
	}

	stroke("#0000ff77");
	fill("#0000cc77")
	polarHexagons(6, 10, 100);
}

class Agent extends c2.Point {
    constructor() {
        super(
			random(width) - width / 2,
			random(height) - height / 2
		);

        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
    }

    update() {
        if (-width / 2 >= this.x || this.x > width / 2) this.vx *= -1;
        if (-height / 2 >= this.y || this.y > height / 2) this.vy *= -1;
		this.x += this.vx;
		this.y += this.vy;
		//this.x = (this.x + this.vx + width / 2) % width - width / 2;
        //this.y = (this.y + this.vy + height / 2) % height - height / 2;
    }
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
