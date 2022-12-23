function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(20);
	noSmooth();
	noLoop();
	randomSeed(0);
	angleMode(RADIANS);
	createForest();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	createForest();
}

function createForest() {
	background(255);
	createTree(0.5, 0.5);
	for (let i = 0; i < 250; ++i) {
		const radians = random(TWO_PI);
		// Radial form for a squircle
		const minRadius = 0.7 / pow(1 - (1 / 2) * pow(sin(2 * radians), 2), 1/4);
		const radMod = abs(randomGaussian(0, 0.2));
		const initTreeX = (minRadius + radMod) * sin(radians);
		const initTreeY = (minRadius + radMod) * cos(radians);
		createTree((initTreeX + 1) / 2, (initTreeY + 1) / 2);
	}
}

// Creates a tree with a starting point at:
// `(x * windowWidth, y * windowHeight)`
function createTree(x, y) {
	const trunk = {
		x: x * windowWidth,
		y: y * windowHeight,
		height: randomGaussian(0.1, 0.02),
	};

	// TODO: Draw trunk
	circle(trunk.x, trunk.y, 10);

	const numBranches = max(1, int(randomGaussian(9, 2)));
	for (let i = 0; i < numBranches; ++i) {
		createBranch(trunk);
	}
}

function createBranch(trunk) {
	// TODO: Create branch
	// TODO: Draw branch
	// TODO: Create twigs
}

function createNeedle(branch) {
	// TODO: Create needle
	// TODO: Draw needle
}
