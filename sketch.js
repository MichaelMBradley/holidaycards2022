/// Some code from https://github.com/ren-yuan/c2.js/blob/main/examples%20for%20p5.js/Voronoi.js
"use strict";

// "default" key from data/keys.json
const DEFAULT_KEY = "DQLRtWT-g5uiUsrqNMbKNIWzpJBB7862mfNgt3L-WqE";
// 2d Array of moving points used to generate the Voronoi background
const agents = Array(4);
// Message to display
let message;
// Seed generated from message;
let seed = 0;

function setup() {
	createCanvas(windowWidth, windowHeight);
	angleMode(RADIANS);
	noLoop();
	for (let i = 0; i < agents.length; ++i) {
		agents[i] = new Array(20);
	}
	createAgents();
	frameRate(30);
	const key = getURLParams()["key"];
	getMessage(key).then(decrypted => {
		message = decrypted;
		parseMessage();
		// Hash key, use it to generate seed
		crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)).then(hashed => {
			let dv = new DataView(hashed);
			for (let i = 0; i < dv.byteLength; ++i) {
				randomSeed(dv.getUint8(i));
				seed ^= random(Number.MAX_SAFE_INTEGER);
			}
			loop();
		})
	});
}

// Parse the markdown-like message
function parseMessage() {
	// Letting my linter know this is a string
	let messageHTML = `${message}`;

	// Add salutation
	messageHTML = messageHTML.replace("<hh>", "\n\nHappy Holidays,");
	messageHTML = messageHTML.replace("<hny>", "\n\nHappy New Year,");

	// Add signatures
	messageHTML = messageHTML.replace("<sig>", "\n*Michael*");
	messageHTML = messageHTML.replace("<fsig>", "\n*Michael Bradley*");

	// Add header (saves time writing cards)
	messageHTML = messageHTML.replace(/^([^\n]*)\n/, "<h1>$1</h1>\n");

	// Add line breaks (non-standard, one newline creates a break)
	messageHTML = messageHTML.replace(/\n/g, "<br>");

	// Add bold and italics
	messageHTML = messageHTML.replace(/\*\*([\w\W]+?)\*\*/g, "<b>$1</b>")
	messageHTML = messageHTML.replace(/\*([\w\W]+?)\*/g, "<em>$1</em>")

	// Add links
	messageHTML = messageHTML.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, "<a href=\"$2\">$1</a>")

	document.getElementById("message").innerHTML = messageHTML;
}

function createAgents() {
	for (const layer of agents) {
		for (let i = 0; i < layer.length; ++i) {
			layer[i] = new Agent();
		}
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	createAgents();
}

function draw() {
	resetMatrix();
	applyMatrix(1, 0, 0, 1, windowWidth / 2, windowHeight / 2);

	background("#002288")

	let alpha = 1;
	const max = 2 * sqrt(width * width + height * height) / 2;
	const rect = new c2.Rect(-width / 2, -height / 2, width, height);
	noStroke();

	for (const layer of agents) {
		const voronoi = new c2.Voronoi();
		voronoi.compute(layer);
		alpha *= 0.2;
		for (let region of voronoi.regions) {
			region = rect.clip(region);
			// If the window is resized, some null issues can crop up on the first frame
			// This should only be encountered occasionally
			if (region === null) return;
			const c = region.centroid();
			const brightness = pow(sqrt(c.x * c.x + c.y * c.y) / max, 1.5)
			fill(127 * brightness, 127 * brightness, 255 * brightness, 255 * (0.25 - alpha));
			beginShape();
			for (const vert of region.vertices) vertex(vert.x, vert.y);
			endShape(CLOSE);
		}
		for (const agent of layer) {
			//circle(agent.x, agent.y, 10);
			agent.update()
		}
	}

	//stroke("#0000ff99");
	fill("#0000cc44");
	const MAX_RAD = 0.75 * min(width, height) / 2;

	randomSeed(seed);
	const baseRadius = random(1 / 6, 1 / 2) * MAX_RAD;
	const baseDeviation = random(baseRadius * 2 / 3);

	polarHexagons(baseDeviation, baseRadius);
	//polarHexagons(0, baseRadius / 4, MAX_RAD * 1.5);
	polarTriangles(baseRadius, -baseDeviation);
	polarTriangles(baseRadius, baseDeviation, MAX_RAD);
	if (baseRadius > MAX_RAD / 3) {
		polarHexagons(MAX_RAD * random(1/2, 4/6), baseRadius * random(0.5, 1))
		polarTriangles(MAX_RAD, random(0.25, 0.75) * baseRadius)
		polarHexagons(baseRadius, MAX_RAD * 0.75);
		polarHexagons(MAX_RAD * random(0.9, 1), random(0.5, 1) * baseRadius)
	} else {
		polarTriangles(-baseDeviation - baseRadius, random(0.75, 1) * baseRadius, baseDeviation* random(1/3, 1/2))
		for(let i = (baseRadius + baseDeviation) / MAX_RAD; i < 1; i += random(0.05, 0.15)) {
			triangles(0, MAX_RAD * i, PI / 3, baseDeviation * 2 * (1 - i / 2), baseRadius * 2 * (1 - i / 2) * random(0.75, 1.5));
			polarHexagons(MAX_RAD * i, baseDeviation * (1-i)* random(1, 1.5));
		}
		const branch = random(0.4, 1);
		if (branch > 0.7) {
			polarHexagons(MAX_RAD * branch, random(0.5, 1) * baseRadius / 2, random(0.5, 1) * baseRadius)
		} else {
			triangles(0, MAX_RAD * branch, PI / 3, baseDeviation, baseRadius * 3);
		}
	}
}

// cos(pi/6), just so shape points constants doesn't have to recalculate it
const cp6 = Math.sqrt(3) / 2;
// Points of a hexagon, normalised
const HEXAGON_POINTS = [
	[1/2, cp6],
	[1, 0],
	[1/2, -cp6],
	[-1/2, -cp6],
	[-1, 0],
	[-1/2, cp6]
];
// Creates 6 hexagons about the origin
// If `height` is given, `radius` acts as width
function polarHexagons(distance, radius, height) {
	polarShape(HEXAGON_POINTS, distance, radius, height)
}

// Points of a triangle, normalised
const TRIANGLE_POINTS = [
	[0, 1],
	[cp6, -1/2],
	[-cp6, -1/2]
]
// Creates 6 triangles about the origin
// If `height` is given, `radius` acts as width
function polarTriangles(distance, radius, height) {
	polarShape(TRIANGLE_POINTS, distance, radius, height)
}

function triangles(x, y, theta, radius, height) {
	if (height === undefined) height = radius;
	const scaleTri = TRIANGLE_POINTS.map(p => [radius * p[0] / 2, height * (p[1] + 0.5) / 2]);
	const rotateTri = scaleTri.map(p => rotatePoint(p[0], p[1], theta));
	mirrorHexShape(rotateTri.map(p => [p[0] + x, p[1] + y]));
}

// Creates 6 shapes about the origin
// Defined by 2d array of `[[x1, y1], [x2, y2], ...]`
function polarShape(shape, distance, radius, height) {
	if (height === undefined) height = radius;
	hexShape(
		shape.map(
			point => [
				point[0] * radius,
				point[1] * height + distance
			]
		)
	);
}

// Given a series of points `[[x1, y1], [x2, y2], ...]`
// Mirror them over the x-axis and call `hexShape` on both
function mirrorHexShape(points) {
	hexShape(points);
	hexShape(points.map(point => [-point[0], point[1]]));
}

// Rotates [x, y] about the origin by theta radians
function rotatePoint(x, y, theta) {
	// Transform point using standard 2d rotation matrix
	return [
		x * cos(theta) - y * sin(theta),
		x * sin(theta) + y * cos(theta)
	]
}

// Given a series of points `[[x1, y1], [x2, y2], ...]`
// Draw the shape they define 6 times, separated by pi/3 rad
function hexShape(points) {
	// Normally I'd do [0, ..., 2pi), but floats make that impossible and the first shape is drawn twice (at 0 and 2pi)
	// This still gets across what I want, and only draws each shape once
	for (let theta = PI / 3; theta <= TWO_PI; theta += PI / 3) {
		beginShape();
		for (let [x, y] of points) {
			[x, y] = rotatePoint(x, y, theta);
			vertex(x, y);
		}
		endShape(CLOSE);
	}
}

class Agent extends c2.Point {
    constructor() {
        super(
			random(windowWidth) - windowWidth / 2,
			random(windowHeight) - windowHeight / 2
		);

        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
    }

    update() {
        if (-width / 2 >= this.x || this.x > width / 2) this.vx *= -1;
        if (-height / 2 >= this.y || this.y > height / 2) this.vy *= -1;
		this.x += this.vx;
		this.y += this.vy;
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
