import ui.TextView as TextView;
import ui.ImageView;
import ui.resource.Image as Image;


exports = Class(GC.Application, function () {
	
	this.particleImages = [];
	this.tileImages = [];
	this.totalTileKinds = 6;

	this.initUI = function () {
	
		// Load images.
		for(i = 0; i < this.totalTileKinds; i++) {
			this.tileImages[i] = new Image({url: "resources/images/gems/gem" + (i + 1) + ".png"});
			this.particleImages[i] = new Image({url: "resources/images/particles/gleam" + (i + 1) + ".png"});
		}
		this.moleKind = this.totalTileKinds - 1;
		this.moleImage = this.tileImages[this.moleKind];
		this.headerImage = new Image({url: "resources/images/ui/header.png"});
		this.backgroundTopImage = new Image({url: "resources/images/ui/backgroundTop.png"});
		this.backgroundBottomImage = new Image({url: "resources/images/ui/backgroundBottom.png"});
		
		this.backgroundBottomImageView = new ui.ImageView({
			superview: this.view,
			image: this.backgroundBottomImage,
			zIndex: 1,
			x: 0,
			y: 0,
			width: this.view.style.width,
			height: this.view.style.height
		});

		this.backgroundTopImageView = new ui.ImageView({
			superview: this.view,
			image: this.backgroundTopImage,
			zIndex: 4,
			x: 0,
			y: 0,
			width: this.view.style.width,
			height: this.view.style.height*.31347 // 321px
		});
		
		this.tvScoreLabel = new TextView({
			superview: this.view,
			text: 'SCORE',
			zIndex: 7,
			color: '#FFCC55',
			x: 0,
			y: 90,
			width: this.view.style.width,
			height: 100,
			size: 44
		});

		this.tvScore = new TextView({
			superview: this.view,
			text: '',
			zIndex: 7,
			color: '#FFCC55',
			x: this.view.style.width/2-182,
			y: 131,
			width: 180,
			height: 100,
			size: 35
		});

		this.tvMolesScore = new TextView({
			superview: this.view,
			text: '',
			zIndex: 7,
			color: '#FFCC55',
			x: this.view.style.width/2-12,
			y: 131,
			width: 180,
			height: 100,
			size: 35
		});

		var scale = 1.5;
		this.headerImageView = new ui.ImageView({
			superview: this.view,
			image: this.headerImage,
			zIndex: 6,
			x: this.view.style.width / 2 - 249 * scale / 2,
			y: 0,
			width: 249 * scale,
			height: 166 * scale
		});
		
		// Set the size of the board and tiles.
		this.boardSize = 6;
		this.boardPaddingLeft = .04 * this.view.style.width;
		this.boardPaddingRight = .03 * this.view.style.width;
		this.boardPaddingTop = .315 * this.view.style.height;
		this.boardPaddingBottom = .175 * this.view.style.height;
		this.tileMargin = .01 * this.view.style.width;
		this.tileWidth = (this.view.style.width - this.boardPaddingLeft - this.boardPaddingRight) / this.boardSize - this.tileMargin;
		this.tileHeight = (this.view.style.height - this.boardPaddingTop - this.boardPaddingBottom) / this.boardSize - this.tileMargin;
		
		// Make an empty grid.
		this.grid = []
		for(var x = 0; x < this.boardSize; x++) {
			this.grid[x] = []
			for(var y = 0; y < this.boardSize; y++) {
				this.grid[x][y] = null;
			}
		}
		
		this.view.on('InputStart', function(event, point) {
			
			if(this.state != 'waiting') {
				return;
			}
			
			var x = point.x;
			var y = point.y;
			this.mouseX = x;
			this.mouseY = y;
			this.mouseStartX = x;
			this.mouseStartY = y;
			var tile = this.pixelToTile(x, y);
			this.selectedTile = tile;
		});
		
		this.view.on('InputSelect', function(event, point) {
			
			if(this.state != 'waiting') {
				return;
			}
			
			var x = point.x;
			var y = point.y;
			var tile = this.pixelToTile(x, y);
			if(this.selectedTile && this.swappingTile) {
				
				// Check how far you've moved the pieces horizontally or vertically.
				if(this.selectedTile.gridY == this.swappingTile.gridY) {
					var dist = this.mouseX - this.mouseStartX;
					var maxDist = this.tileWidth + this.tileMargin
				} else {
					var dist = this.mouseY - this.mouseStartY;
					var maxDist = this.tileHeight + this.tileMargin
				}
				
				// If you moved the piece far enough to be considered a swap.
				if(Math.abs(dist) > maxDist / 2) {
					
					// Swap grid pointers.
					this.grid[this.selectedTile.gridX][this.selectedTile.gridY] = this.swappingTile;
					this.grid[this.swappingTile.gridX][this.swappingTile.gridY] = this.selectedTile;
					
					// Swap tile positions.
					var swappingTileGridX = this.swappingTile.gridX;
					var swappingTileGridY = this.swappingTile.gridY;
					this.swappingTile.gridX = this.selectedTile.gridX;
					this.swappingTile.gridY = this.selectedTile.gridY;
					this.selectedTile.gridX = swappingTileGridX;
					this.selectedTile.gridY = swappingTileGridY;
					
					this.checkForMatch();
					
					this.userMatched = true;
					if(this.state != 'matching') {
						this.state = 'falling';
					}
				}
			}
			
			// Put tiles visually where they should be.
			if(this.swappingTile) {
				this.swappingTile.imageView.style.x = this.getTilePixelX(this.swappingTile.gridX);
				this.swappingTile.imageView.style.y = this.getTilePixelY(this.swappingTile.gridY);
				this.swappingTile = null;
			}
			if(this.selectedTile) {
				this.selectedTile.imageView.style.x = this.getTilePixelX(this.selectedTile.gridX);
				this.selectedTile.imageView.style.y = this.getTilePixelY(this.selectedTile.gridY);
				this.selectedTile = null;
			}
		});
		
		this.view.on('InputMove', function(event, point) {
			
			if(this.state != 'waiting') {
				return;
			}

			if(this.selectedTile) {
				
				// Check how much the mouse moved.
				var x = point.x;
				var y = point.y;
				this.mouseMoveX = x - this.mouseX;
				this.mouseMoveY = y - this.mouseY;
				this.mouseX = x;
				this.mouseY = y;
				
				// Put back the tile you were previously swapping with, in case you completely change the direction you're dragging.
				if(this.swappingTile) {
					this.swappingTile.imageView.style.x = this.getTilePixelX(this.swappingTile.gridX);
					this.swappingTile.imageView.style.y = this.getTilePixelY(this.swappingTile.gridY);
					this.swappingTile = null;
				}
				
				// Check if you're swapping horizontall or vertically and how far.
				var goX = 0;
				var goY = 0;
				if(Math.abs(this.mouseX - this.mouseStartX) > Math.abs(this.mouseY - this.mouseStartY)) {
					var far = this.mouseX - this.mouseStartX;
					var max = this.tileWidth + this.tileMargin;
					if(Math.abs(far) > max) {
						far = max * Math.sign(far);
					}
					goX = far;
				} else {
					var far = this.mouseY - this.mouseStartY;
					var max = this.tileHeight + this.tileMargin;
					if(Math.abs(far) > max)
					{
						far = max * Math.sign(far);
					}
					goY = far;
				}
				
				// Visually move the piece you're dragging.
				this.selectedTile.imageView.style.x = this.getTilePixelX(this.selectedTile.gridX) + goX;
				this.selectedTile.imageView.style.y = this.getTilePixelY(this.selectedTile.gridY) + goY;
				
				// Get the adjacent tile that you're swapping with.
				var swappingTile = this.getFromGrid(this.selectedTile.gridX + Math.sign(goX), this.selectedTile.gridY + Math.sign(goY));
				if(swappingTile) {
					this.swappingTile = swappingTile;
					this.swappingTile.imageView.style.x = this.getTilePixelX(this.swappingTile.gridX) - goX;
					this.swappingTile.imageView.style.y = this.getTilePixelY(this.swappingTile.gridY) - goY;
				}
			}
		});
		
		this.level = 1;
		this.targetScore = 100;
		this.resetGame();
		this.interval = setInterval(this.loop.bind(this), 32);

	};
	
	// Returns the tile at this board position. Returns false if out of bounds. Returns null if there is no tile there.
	this.getFromGrid = function(gridX, gridY) {
		if(gridX < 0 || gridY < 0 || gridX >= this.boardSize || gridY >= this.boardSize) {
			return false;
		}
		return this.grid[gridX][gridY];
	};

	// Finds the tile under this screen position.
	this.pixelToTile = function(pixelX, pixelY) {
		var gridX = Math.floor((pixelX - this.boardPaddingLeft) / (this.tileWidth + this.tileMargin));
		var gridY = Math.floor((pixelY - this.boardPaddingTop) / (this.tileHeight + this.tileMargin));
		return this.getFromGrid(gridX, gridY);
	};

	this.getTilePixelX = function(gridX) {
		return gridX * (this.tileWidth + this.tileMargin) + this.boardPaddingLeft;
	};

	this.getTilePixelY = function(gridY) {
		return gridY * (this.tileHeight + this.tileMargin) + this.boardPaddingTop;
	};


	this.checkForMatch = function() {
		var addX;
		var addY;
		var totalMatched;
		var tile;
		var startingTile;
		
		// Check the whole board for matches. Could be sped to check only pieces that have moved.
		for(var gridX = 0; gridX < this.boardSize; gridX++) {
			for(var gridY = 0; gridY < this.boardSize; gridY++) {
				tile = this.grid[gridX][gridY];
				startingTile = tile;
				if(tile && tile.kind != this.moleKind) {
					// Check horizontally from this tile, then check vertically.
					for(var vertical = 0; vertical <= 1; vertical++) {
						if(vertical == 1) {
							addX = 0;
							addY = 1;
						} else {
							addX = 1;
							addY = 0;
						}
						
						// Make one pass to check for match-3, and a second pass to remove all matched pieces.
						for(var alter = 0; alter <= 1; alter++) {
							totalMatched = 0;
							tile = startingTile;
							while(tile && tile.kind == startingTile.kind) {
								totalMatched++;
								if(alter == 1) {
									tile.dying = true;
									tile.sizeSpeed = 12;
									this.state = 'matching';
									this.removeAdjacentMoles(tile);
								}
								tile = this.getFromGrid(tile.gridX + addX, tile.gridY + addY);
							}
							
							// Don't alter the board if there's less than 3 in a row.
							if(totalMatched < 3) {
								break;
							}
						}
					}
				}
			}
		}
	};
	
	// When you match a piece, it removes all moles adjacent to that piece.
	this.removeAdjacentMoles = function(tile) {
		var adjacentTile;
		
		// Check all sides for moles.
		for(var addY = -1; addY <= 1; addY++) {
			for(var addX = -1; addX <= 1; addX++) {
				if(addX == 0 || addY == 0) {
					adjacentTile = this.getFromGrid(tile.gridX + addX, tile.gridY + addY);
					if(adjacentTile && adjacentTile.kind == this.moleKind)
					{
						// Remove mole.
						adjacentTile.dying = true;
						adjacentTile.sizeSpeed = 5;
					}
				}
			}
		}
	};
	
	this.setScore = function(score) {
		if(score < 0) {
			score = 0;
		}
		this.score = score
		this.tvScore.setText('You: ' + this.score);
	};
	
	this.setMolesScore = function(score) {
		if(score < 0) {
			score = 0;
		}
		this.molesScore = score
		this.tvMolesScore.setText('Moles: ' + this.molesScore);
	};
	
	this.loop = function() {
		var falling = false;
		var matching = false;
		
		// Update particles.
		for(var i = 0; i < this.particles.length; i++) {
			var particle = this.particles[i];
			
			particle.y -= 1;
			particle.x += Math.cos(particle.life / 8);
			particle.imageView.style.x = particle.x;
			particle.imageView.style.y = particle.y;
			
			particle.life--;
			if(particle.life <= 15)
			{
				particle.imageView.style.width -= 3;
				particle.imageView.style.height -= 3;
			}
			if(particle.life <= 0)
			{
				particle.imageView.removeFromSuperview();
				this.particles.splice(i, 1);
				i--;
			}
		}
		
		// Update tiles.
		for(var i = 0; i < this.tiles.length; i++) {
			var tile = this.tiles[i];
			
			if(this.state == 'matching') {
				// Animate tiles that are being removed.
				if(tile.dying) {
					matching = true;
					
					// Make matched pieces shrink.
					tile.sizeSpeed -= 3;
					tile.imageView.style.width += tile.sizeSpeed;
					tile.imageView.style.height += tile.sizeSpeed;
					
					// If this is being eaten by a mole, make it move towards the mole.
					if(tile.moleTile) {
						tile.offsetX += Math.sign(tile.moleTile.gridX - tile.gridX) * 8;
						tile.offsetY += Math.sign(tile.moleTile.gridY - tile.gridY) * 8;
					}
					
					// Keep it centered, even though its size is changing.
					tile.imageView.style.x = this.getTilePixelX(tile.gridX) - (tile.imageView.style.width - this.tileWidth) / 2 + tile.offsetX;
					tile.imageView.style.y = this.getTilePixelY(tile.gridY) - (tile.imageView.style.height - this.tileHeight) / 2 + tile.offsetY;
					
					// Moles spin when dying.
					if(tile.kind == this.moleKind) {
						tile.imageView.style.r += .05;
					}
					
					// Piece finished shrinking, remove it and get score.
					if(tile.imageView.style.height < 1) {
						this.makeParticle(tile);
						if(tile.moleTile) {
							this.setMolesScore(this.molesScore + 2);
						} else {
							if(tile.kind != this.moleKind) {
								this.setScore(this.score + 2);
							}
						}
						this.grid[tile.gridX][tile.gridY] = null;
						tile.imageView.removeFromSuperview();
						this.tiles.splice(i, 1);
						i--;
					}
				}
				
			} else if(this.state == 'falling') {
				
				// Tiles fall down.
				if(tile.falling) {
					falling = true;
					tile.offsetYSpeed += .8;
					tile.offsetY += tile.offsetYSpeed;
					
					// Reached the next lower grid position.
					if(tile.offsetY >= 0) {
						var tileBelow = this.getFromGrid(tile.gridX, tile.gridY + 1);
						
						// Stop falling if you hit a tile that isn't also falling.
						if(tileBelow === false || (tileBelow && !tileBelow.falling)) {
							tile.offsetY = 0;
							tile.offsetYSpeed = 0;
							tile.falling = false;
						} else if(tileBelow === null) {
							tile.falling = false;
						} else if(tileBelow && tileBelow.falling) {
							tile.offsetY -= tile.offsetYSpeed;
						}
					}
					tile.imageView.style.y = this.getTilePixelY(tile.gridY) + tile.offsetY;
				}
				
				// Check if there's now nothing below this tile. Make it fall.
				if(!tile.falling && this.getFromGrid(tile.gridX, tile.gridY + 1) === null) {
					
					// Move down to claim the next grid position.
					this.grid[tile.gridX][tile.gridY] = null;
					tile.gridY++;
					this.grid[tile.gridX][tile.gridY] = tile;
					
					// Start falling.
					tile.offsetY -= this.tileHeight + this.tileMargin;
					tile.falling = true;
				}
				
			}
		}
		
		if(this.state == 'falling') {
			// As soon as there's room, drop in new tiles at the top.
			for(var gridX = 0; gridX < this.boardSize; gridX++) {
				if(!this.getFromGrid(gridX,0)) {
					this.dropInTile(gridX);
					falling = true;
				}
			}
			
			// Everything finished falling.
			if(!falling) {
				
				// Check for victory.
				if(this.score >= this.targetScore) {
					this.state = 'win';
					
					// Remove all moles.
					for(var gridX = 0; gridX < this.boardSize; gridX++) {
						for(var gridY = 0; gridY < this.boardSize; gridY++) {
							tile = this.grid[gridX][gridY];
							if(tile && tile.kind == this.moleKind) {
								tile.dying = true;
								tile.sizeSpeed = 5;
								this.state = 'matching';
							}
						}
					}
					
					// Avter victory, keep removing matches until there are none.
					if(this.state == 'win') {
						this.checkForMatch();
						
						// Now if there was no matches then everything is settled and state will stay at win.
						if(this.state == 'win') {
							this.winLoops = this.loops;
						}
					}
					
				} else if(this.molesScore >= this.targetScore) {
					this.state = 'lose';
				} else {
					
					this.state = 'moleing';
					this.checkForMatch();
				}
			}
		}
		else if(this.state == 'moleing') {
			this.state = 'waiting';
			
			// All mokles get their turn to take pieces.
			if(this.userMatched && !this.molesWent) {
				this.molesWent = true;
				var tile;
				for(var gridX = 0; gridX < this.boardSize; gridX++) {
					for(var gridY = 0; gridY < this.boardSize; gridY++) {
						tile = this.grid[gridX][gridY];
						if(tile && tile.kind == this.moleKind) {
							
							// Find all the pieces that this mole could take.
							var choices = [];
							for(var addY = -1; addY <= +1; addY++) {
								for(var addX = -1; addX <= +1; addX++) {
									if(addX == 0 || addY == 0) {
										var tile2 = this.getFromGrid(gridX + addX, gridY + addY);
										if(tile2 && tile2.kind != this.moleKind && !tile2.dying) {
											choices.push(tile2);
										}
									}
								}
							}
							
							// This mole chooses a piece to take.
							if(choices.length > 0) {
								var choiceIndex = Math.floor(Math.random() * choices.length);
								var tile2 = choices[choiceIndex];
								tile2.dying = true;
								tile2.sizeSpeed = 10;
								tile2.moleTile = tile;
								this.state = 'matching';
								addY = 1;
							}
						}
					}
				}
			}
			
			// Moles did not take any pieces. Reset to the next turn for the user.
			if(this.state == 'waiting') {
				this.userMatched = false;
				this.molesWent = false;
			}
		} else if(this.state == 'matching') {
			if(!matching) {
				this.state = 'falling';
			}
		}
		
		if(this.state == 'win' || this.score >= this.targetScore) {
			this.tvScoreLabel.setText("YOU WIN!");
			
			// Animate score board for victory.
			if(this.loops % 10 < 5) {
				this.tvScoreLabel._opts.color = '#FFCC55';
			} else {
				this.tvScoreLabel._opts.color = '#BB8811';
			}
		} else if(this.state == 'lose' || this.molesScore >= this.targetScore) {
			this.tvScoreLabel.setText("MOLES WIN!");
			
			// Animate score board slower for defeat.
			if(this.loops % 18 < 9) {
				this.tvScoreLabel._opts.color = '#FFCC55';
			} else {
				this.tvScoreLabel._opts.color = '#BB8811';
			}
		}
		
		if(this.state == 'win') {
			if(this.loops > this.winLoops + 100) {
				this.level++;
				this.resetGame();
			}
		}
		
		this.loops++;
	};
	
	this.resetGame = function() {
		console.log('resetGame()');
		this.piecesUntilMole = 10;
		this.setScore(0);
		this.setMolesScore(0);
		this.state = 'falling';
		this.loops = 0;
		this.winLoops = 0;
		this.tvScoreLabel.setText("SCORE");
		this.tvScoreLabel._opts.color = '#FFCC55';
		this.particles = [];
		this.tiles = [];
		
		for(var x = 0; x < this.boardSize; x++) {
			for(var y = 0; y < this.boardSize; y++) {
				var tile = this.grid[x][y];
				if(tile) {
					tile.imageView.removeFromSuperview();
					this.grid[x][y] = null;
				}
			}
		}
		
	}

	this.dropInTile = function(gridX) {
		
		// Choose which kind of piece should fall in.
		var kind = Math.floor(Math.random() * (this.totalTileKinds - 1));
		
		// Moles are more common on higher levels.
		this.piecesUntilMole--;
		if(this.piecesUntilMole <= 0) {
			kind = this.moleKind;
			this.piecesUntilMole = 8 - Math.random() * this.level;
		}
		
		// Moles should be drawn behind gems so you can see them eat the gems.
		var zIndex = 3;
		if(kind == this.moleKind) {
			zIndex--;
		}
		
		// Create a tile.
		var tile = {}
		tile.gridX = gridX;
		tile.gridY = 0;
		tile.offsetX = 0;
		tile.offsetY = -this.tileHeight - this.tileMargin;
		tile.offsetYSpeed = 0;
		tile.imageView = new ui.ImageView({
			superview: this.view,
			image: this.tileImages[kind],
			x: this.getTilePixelX(tile.gridX),
			y: this.getTilePixelY(tile.gridY) + tile.offsetY,
			width: this.tileWidth,
			height: this.tileHeight,
			zIndex: zIndex
		});
		tile.kind = kind;
		tile.falling = true;
		this.grid[tile.gridX][tile.gridY] = tile;
		this.tiles.push(tile);
	};
	
	this.makeParticle = function(tile) {
		var particle = {}
		var size = this.tileWidth / 2;
		particle.x = Math.floor(tile.imageView.style.x - size + Math.random() * size);
		particle.y = Math.floor(tile.imageView.style.y - size + Math.random() * size);
		particle.life = 30;
		particle.imageView = new ui.ImageView({
			superview: this.view,
			image: this.particleImages[tile.kind],
			x: particle.x,
			y: particle.y,
			width: size,
			height: size,
			zIndex: 4
		});
		this.particles.push(particle);
	};

	this.launchUI = function () {

	};

});
