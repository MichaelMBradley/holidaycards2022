const MAX_TREES = 1500;
const WOOD_COLOUR = "#b87541";
const NEEDLE_COLOUR = "#2aa21a";
let numTrees = 0;

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(30);
	noSmooth();
	noStroke();
	angleMode(RADIANS);
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
	const minRadius = 0.7 / pow(1 - (1 / 2) * pow(sin(2 * radians), 2), 1/4);
	const radMod = abs(randomGaussian(0, 0.2));
	const initTreeX = (minRadius + radMod) * sin(radians);
	const initTreeY = (minRadius + radMod) * cos(radians);
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
		l: (d + random()) / 4 * trunk.h ,
	};
	strokeWeight(d * 2);
	stroke(WOOD_COLOUR);
	line(branch.x, branch.y, branch.x + cos(branch.r) * branch.l, branch.y + sin(branch.r) * branch.l);
	noStroke();
	/*fill(WOOD_COLOUR);
	triangle(
		branch.x + cos(branch.r + HALF_PI) * branch.l / 10,
		branch.y + sin(branch.r + HALF_PI) * branch.l / 10,
		branch.x + cos(branch.r - HALF_PI) * branch.l / 10,
		branch.y + sin(branch.r - HALF_PI) * branch.l / 10,
		branch.x + cos(branch.r) * branch.l,
		branch.y + sin(branch.r) * branch.l,
		);*/
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
	/*triangle(
		needle.x + cos(needle.r + HALF_PI) * needle.l / 10,
		needle.y + sin(needle.r + HALF_PI) * needle.l / 10,
		needle.x + cos(needle.r - HALF_PI) * needle.l / 10,
		needle.y + sin(needle.r - HALF_PI) * needle.l / 10,
		needle.x + cos(needle.r) * needle.l,
		needle.y + sin(needle.r) * needle.l,
		);*/
	noStroke();
}
