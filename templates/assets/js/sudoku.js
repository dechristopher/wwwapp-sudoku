/**
 * Seeds a pseudo-random number generator. The seed must be an integer.
 *
 * Credit to 
 * https://gist.github.com/blixt/f17b47c62508be59987b
 * @param {Number} seed An integer seed value
 */
var Random = function ( seed ) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
}
  
/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 * @returns a pseudo-random integer
 */
Random.prototype.next = function () {
    return this._seed = this._seed * 16807 % 2147483647;
};
  
/**
 * Returns a pseudo-random floating point number in range [0, 1).
 * @returns a pseudo-random number
 */
Random.prototype.nextFloat = function () {
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return ( this.next() - 1 ) / 2147483646;
};

/**
 * Returns a pseudo-random integer in the range [min, max)
 * @param {Number} min
 * @param {Number} max
 * @returns a pseudo-random integer
 */
Random.prototype.nextInt = function ( min, max ) {
    return Math.floor( this.nextFloat() * ( max - min ) + min );
}

/**
 * Shuffles an array of values
 * @param {Array} array 
 */
Random.prototype.shuffle = function ( array ) {
    var i, j, temp;
    for ( i = array.length - 1; i >= 0; --i ) {
        j = this.nextInt( 0, i + 1 );
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * Constructor for a Sudoku object.
 * @param {Object} config configuration data for the Sudoku puzzle
 */
var Sudoku = function( config ) {
    var $table;
    var _game;
    var _timer;
    var _config;
    
    /**
     * Default configuration information
     */
    var defaultConfig = {
        // Specifies the type of sudoku.
        // Valid values are "Normal", "Big", and "Diagonal"
        type: "Normal",
        // The seed value of this puzzle
        // A specific seed will produce only one puzzle every time
        // Must be an integer > 0.
        // If = 0, a random seed is generated when the puzzle is created
        seed: 0,
        // Specifies the difficulty of this puzzle
        // options are "Easy", "Medium", "Hard"
        difficulty: "Easy"
    }

    /** 
     * Initialize the Sudoku object
     * @param {Object} config configuration data
     * @returns {Object} public methods
    */
    var init = function( config ) {
        _config = $.extend( {}, defaultConfig, config );
        _game = new Game( _config );
        if ( !_game ) {
            console.log( "Game did not initialize properly, aborting..." );
            return "Error! Sudoku could not initialize.";
        }
        _timer = new Timer();

        $table = _game.buildTable();

        // Public methods
        return {
            /**
             * Return the html representation of the sudoku board
             * @returns {jQuery} sudoku table
             */
            getTable: function() {
                return $table;
            },

            /**
             * Return the timer object stored in this instance
             * @returns {Object} timer
             */
            getTimer: function() {
                return _timer;
            },

            /**
             * Return the config object for the sudoku
             */
            getConfig: function() {
                return _config;
            },

            /**
             * Reset the game board
             */
            reset: function() {
                _game.resetPuzzle();
            },

            /**
             * Check the completeness of the sudoku board
             * Will add a valid style if there are no errors in the
             * current entries.
             * @returns {Boolean} true if the puzzle is complete
             */
            validate: function() {
                var isComplete = _game.validatePuzzle();
				if(isComplete == true){
					timer.stop();
				}
                return isComplete;
            },

            /**
             * Create the sudoku puzzle
             */
            create: function() {
                _game.createPuzzle();
                _timer.resetTime();
                _timer.start();
            },

            /**
             * Solve the current board
             */
            solve: function() {
                _game.solvePuzzle();
            },

            /**
             * Toggle the timer active state
             * Hides the puzzle while the timer is inactive
             */
            pause: function() {
                if (_timer.isOn()) {
                    _timer.stop();
                } else {
                    _timer.start();
                }
                // TODO Toggle the visibility of the puzzle
            }
        };
    }

    /**
     * Sudoku game engine
     * @constructor
     * @param {Object} config configuration data
     */
    function Game( config ) {
        if ( config.type === "Normal" || config.type === "Diagonal" ) {
            this.gridSize = 9;
            this.sectSize = 3;
        } else if ( this.config.type === "Big" ) {
            this.gridSize = 16;
            this.sectSize = 4;
        } else {
            alert( "Invalid Puzzle type! Please use \"Normal\", \"Big\", or \"Diagonal\"." );
            return null;
        }
        this.config = config;
        this.$inputCells = {};
        this.matrix = {};
        this.validation = {};
        this.rand = new Random( this.config.seed );

        this.resetMatrices();

        return this;
    }

    Game.prototype = {
    
        /**
         * Build the html for the sudoku board
         * @returns {jQuery} sudoku table
         */
        buildTable: function() {
            var i, j;
            var $table = $( "<table>" ).addClass( "sudoku-container" );
            var $tr;
            var $td;

            for ( i = 0; i < this.gridSize; ++i ) {
                $tr = $( "<tr>" );
                this.$inputCells[i] = {};

                for ( j = 0; j < this.gridSize; ++j ) {
                    this.$inputCells[i][j] = $( "<input>" )
                        .attr( "maxlength", 1 )
                        .data( "row", i )
                        .data( "col", j )
                        .on( "input", $.proxy( this.onInput, this ) );

                    $td = $( "<td>" ).append( this.$inputCells[i][j] );

                    // This adds the inner puzzle border styles
                    if ( i !== 0 && i % this.sectSize === 0 ) {
                        $td.addClass( "sudoku-section-top" );
                    }
                    if ( j !== 0 && j % this.sectSize === 0 ) {
                        $td.addClass( "sudoku-section-left" );
                    }

                    // This will highlight the diagonal cell entries if this is a Diagonal sudoku
                    if ( this.config.type === "Diagonal" && i === j ) {
                        $td.addClass( "sudoku-diagonal" );
                    }
                    if ( this.config.type === "Diagonal" && i + j === this.gridSize - 1 ) {
                        $td.addClass( "sudoku-diagonal" );
                    }

                    $tr.append( $td );
                }

                $table.append( $tr );
            }
            return $table;
        },

        /**
         * Handle input event on an input cell
         * @param {jQuery.event} e Input event
         */
        onInput: function( e ) {
            var val, row, col, sectRow, sectCol, sectIndex, oldVal, isValid;

            $( ".sudoku-container" ).removeClass( "valid-matrix" );

            val = $( e.currentTarget ).val().toUpperCase();
            row = $( e.currentTarget ).data( "row" );
            col = $( e.currentTarget ).data( "col" );
            oldVal = this.matrix.row[row][col];
            $( e.currentTarget ).val( val ); // changes to uppercase if necessary

            // Discard invalid inputs
            if ( !this.isValidInput( val ) ) {
                val = "";
                $( e.currentTarget ).val( "" );
            }

            isValid = this.validateEntry( val, row, col, oldVal );
            $( e.currentTarget ).toggleClass( "sudoku-input-error", !isValid );

            this.setMatrixEntry( val, row, col );
        },

        /**
         * Check if val is a valid input for this puzzle
         * @param {String} val
         * @returns {Boolean} true if val is valid
         */
        isValidInput: function( val ) {
            if ( this.gridSize === 9 ) {
                return $.isNumeric( val ) && parseInt( val, 10 ) > 0;
            } else if ( this.gridSize === 16 ) {
                var hexReg = /[0-9A-F]/
                return hexReg.test( val );
            }
        },

        /**
         * Clear all the user entries from the puzzle
         */
        resetPuzzle: function() {
            var row, col, sectRow, sectCol, sectIndex, val;
            this.resetMatrices();
            for ( row = 0; row < this.gridSize; ++row ) {
                for ( col = 0; col < this.gridSize; ++col ) {
                    // If the input is read-only, repopulate the matrices
                    // otherwise, clear the input
                    if ( this.$inputCells[row][col].prop( "readonly" ) ) {
                        val = this.$inputCells[row][col].val();
                        sectRow = Math.floor( row / this.sectSize );
                        sectCol = Math.floor( col / this.sectSize );

                        this.setMatrixEntry( val, row, col );

                        this.validation.row[row].push( val );
                        this.validation.col[col].push( val );
                        this.validation.sect[sectRow][sectCol].push( val );

                        if ( this.config.type === "Diagonal" ) {
                            if ( row === col ) {
                                this.validation.diag[0].push( val );
                            } else if ( row + col === this.gridSize - 1 ) {
                                this.validation.diag[1].push( val );
                            }
                        }
                    } else {
                        this.$inputCells[row][col].val( "" );
                        this.$inputCells[row][col].removeClass( "sudoku-input-error" );
                    }
                }
            }
        },

        /**
         * Reset the matrices indicating 
         */
        resetMatrices: function() {
            var i, j;
            this.matrix = { row: [], col: [], sect: [] };
            this.validation = { row: [], col: [], sect: [] };

            for ( i = 0; i < this.gridSize; ++i ) {
                this.matrix.row[i] = Array.from({length:this.gridSize}, x => '');
                this.matrix.col[i] = Array.from({length:this.gridSize}, x => '');
                this.validation.row[i] = [];
                this.validation.col[i] = [];
            }
            
            for ( i = 0; i < this.sectSize; ++i ) {
                this.matrix.sect[i] = [];
                this.validation.sect[i] = [];
                for ( j = 0; j < this.sectSize; ++j ) {
                    this.matrix.sect[i][j] = Array.from({length:this.gridSize}, x => '');
                    this.validation.sect[i][j] = [];
                }
            }

            // Add the diagonal matrices if this is a diagonal puzzle
            this.matrix.diag = [];
            this.matrix.diag[0] = Array.from({length:this.gridSize}, x => '');
            this.matrix.diag[1] = Array.from({length:this.gridSize}, x => '');
            this.validation.diag = [];
            this.validation.diag[0] = [];
            this.validation.diag[1] = [];
        },

        /**
         * Set the value of the matrices' cells at row,col
         * @param {String} val the entry
         * @param {Number} row the row index
         * @param {Number} col the col index
         * @returns {String} the old value in the matrices' cells
         */
        setMatrixEntry: function( val, row, col ) {
            var oldVal = this.matrix.row[row][col];
            var sectRow = Math.floor( row / this.sectSize );
            var sectCol = Math.floor( col / this.sectSize );
            var sectIndex = ( row % this.sectSize ) * this.sectSize + ( col % this.sectSize );

            this.matrix.row[row][col] = val;
            this.matrix.col[col][row] = val;
            this.matrix.sect[sectRow][sectCol][sectIndex] = val;
            if ( row === col ) {
                this.matrix.diag[0][row] = val;
            } 
            if ( row + col === this.gridSize - 1 ) {
                this.matrix.diag[1][row] = val;
            }
            return oldVal;
        },

        /**
         * Check the completeness of the puzzle. Will add a valid
         * style to the puzzle if there are no errors.
         * @returns {Boolean} true if the puzzle is complete
         */
        validatePuzzle: function() {
            var val, isValid, error = false, complete = true;

            for ( var row = 0; row < this.gridSize; ++row ) {
                for ( var col = 0; col < this.gridSize; ++col ) {
                    // Don't validate the read only puzzle entries
                    if ( !this.$inputCells[row][col].prop( "readonly" ) ) {
                        val = this.$inputCells[row][col].val();
                        if ( val === "" ) {
                            complete = false;
                        }
                        isValid = this.validateEntry( val, row, col, val );
                        this.$inputCells[row][col].toggleClass( "sudoku-input-error", !isValid );
                        if ( !isValid ) {
                            error = true;
                            complete = false;
                        }
                    }
                }
            }
            $( ".sudoku-container" ).toggleClass( "valid-matrix", !error );
            return complete;
        },

        /**
         * Validate a new number being added to the sudoku
         * @param {String} val the new value being added
         * @param {Number} row the row index
         * @param {Number} col the column index
         * @param {String} oldVal the old value to remove
         * @returns {Boolean} true if the new value does not conflict with other entries
         */
        validateEntry: function( val, row, col, oldVal ) {
            var isValid;
            var sectRow = Math.floor( row / this.sectSize );
            var sectCol = Math.floor( col / this.sectSize );

            // Remove the old value from the validation matrix
            if ( oldVal !== "" ) {
                if ( $.inArray( oldVal, this.validation.row[row] ) > -1 ) {
                    this.validation.row[row].splice( 
                        $.inArray( oldVal, this.validation.row[row] ), 1
                    );
                }
                if ( $.inArray( oldVal, this.validation.col[col] ) > -1 ) {
                    this.validation.col[col].splice( 
                        $.inArray( oldVal, this.validation.col[col] ), 1 
                    );
                }
                if ( $.inArray( oldVal, this.validation.sect[sectRow][sectCol] ) > -1 ) {
                    this.validation.sect[sectRow][sectCol].splice( 
                        $.inArray( oldVal, this.validation.sect[sectRow][sectCol] ), 1
                    );
                }
                if ( this.config.type === "Diagonal" ) {
                    if ( row === col && $.inArray( oldVal, this.validation.diag[0] ) > -1 ) {
                        this.validation.diag[0].splice(
                            $.inArray( oldVal, this.validation.diag[0] ), 1
                        );
                    } else if ( row + col === this.gridSize - 1 && $.inArray( oldVal, this.validation.diag[1] ) > -1 ) {
                        this.validation.diag[1].splice(
                            $.inArray( oldVal, this.validation.diag[1] ), 1
                        );
                    }
                }
            }

            // If the val is already in the array, this input is invalid
            isValid = true;
            if ( $.inArray( val, this.validation.row[row] ) > -1 )                      isValid = false;
            else if ( $.inArray( val, this.validation.col[col] ) > -1 )                 isValid = false;
            else if ( $.inArray( val, this.validation.sect[sectRow][sectCol] ) > -1 )   isValid = false;
            else if ( this.config.type === "Diagonal" && row === col &&
                      $.inArray( val, this.validation.diag[0] ) > -1 )                  isValid = false;
            else if ( this.config.type === "Diagonal" && row + col === this.gridSize - 1 &&
                      $.inArray( val, this.validation.diag[1] ) > -1 )                  isValid = false;
            
            // Add the new value to the validation matrix
            if ( val !== "" ) {
                this.validation.row[row].push( val );
                this.validation.col[col].push( val );
                this.validation.sect[sectRow][sectCol].push( val );
                if ( this.config.type === "Diagonal" ) {
                    if ( row === col ) {
                        this.validation.diag[0].push( val );
                    } else if ( row + col === this.gridSize - 1 ) {
                        this.validation.diag[1].push( val );
                    }
                }
            }

            return isValid;
        },

        /**
         * Creates a sudoku puzzle generated by a specified seed
         * @param {Number} seed an integer value
         */
        createPuzzle: function( seed ) {
            var row, col, sectRow, sectCol;

            // Sets the config seed value if a proper seed value is supplied
            if ( $.isNumeric( seed ) && this.config.seed != 0 ) {
                this.config.seed = seed;
            }
            // If the current seed is 0, generate a seed based on system time
            if ( this.config.seed === 0 ) {
                this.config.seed = new Date().getTime();
            }
            // reseed the pseudo-random number generator
            this.rand = new Random( this.config.seed );

            // Creates a completed grid
            this.solvePuzzle();

            // Creates a unique puzzle out of the completed grid
            this.createUniquePuzzle();

            // Make the remaining numbers readonly
            // and add them to the validation matrix
            for ( row = 0; row < this.gridSize; ++row ) {
                for ( col = 0; col < this.gridSize; ++col ) {
                    if ( this.$inputCells[row][col].val() !== "" ) {
                        var val = this.$inputCells[row][col].val();
                        sectRow = Math.floor( row / this.sectSize );
                        sectCol = Math.floor( col / this.sectSize );
                        this.$inputCells[row][col].prop( "readonly", true );
                        this.validation.row[row].push( val );
                        this.validation.col[col].push( val );
                        this.validation.sect[sectRow][sectCol].push( val );
                        if ( this.config.type === "Diagonal" ) {
                            if ( row === col ) {
                                this.validation.diag[0].push( val );
                            } else if ( row + col === this.gridSize - 1 ) {
                                this.validation.diag[1].push( val );
                            }
                        }
                    }
                }
            }
        },

        /**
         * Solve the sudoku puzzle. If the grid is empty, it will
         * generate a random completed sudoku
         * @returns {Boolean} true if the puzzle was solved
         */
        solvePuzzle: function( ) {
            var emptySquares = this.findAllEmptySquares();
            return this._solvePuzzle( emptySquares );
        },

        /**
         * Recursive method for solving the sudoku puzzle
         * @param {Array} emptySquares a list of the currently squares
         * @returns {Boolean} true if the puzzle was solved on this path
         */
        _solvePuzzle: function( emptySquares ) {
            var next, i, row, col, sectRow, sectCol, sectIndex, val;

            // If there are no more empty squares, the puzzle is solved
            if ( emptySquares.length === 0 ) {
                return true;
            }

            next = this.findBestEmptySquare( emptySquares );

            // There is a square with no legal numbers so we need to backtrack
            if ( next === null ) {
                return false;
            }

            row = next.square.row;
            col = next.square.col;

            // remove this square from the empty squares list
            emptySquares.splice( emptySquares.indexOf( next.square ), 1 );

            this.rand.shuffle( next.legalValues );
            for ( i = 0; i < next.legalValues.length; ++i ) {
                val = next.legalValues[i];

                // Update the value in the input cell
                this.$inputCells[row][col].val( val );
                
                this.setMatrixEntry( val, row, col );

                // Try to solve the puzzle with the new entry in place
                if ( this._solvePuzzle( emptySquares ) ) {
                    return true;
                }
            }

            // If none of the legal numbers led to a solution, reset
            // all the values for this cell, add it back to the empty
            // squares list and return to an earlier step
            this.$inputCells[row][col].val( '' );
            this.setMatrixEntry( '', row, col );
            emptySquares.push( next.square );
            return false;
        },

        /**
         * Removes numbers from the sudoku grid to match the difficulty
         * supplied by the configuration object and guarentees a unique
         * solution to the problem
         */
        createUniquePuzzle: function() {
            // TODO Take into account difficulty level
            var cellsToClear, clearedCells;

            cellsToClear = 41; // need to make this based on difficulty level
            clearedCells = 0;
            while ( clearedCells < cellsToClear ) {
                var val, row, col, sectRow, sectCol, sectIndex,
                    symVal, symSectIndex;
                row = this.rand.nextInt( 0, this.gridSize );
                col = this.rand.nextInt( 0, this.gridSize );
                
                // Check if this cell has already been cleared
                if ( this.$inputCells[row][col].val() !== '' ) {
                    val = this.$inputCells[row][col].val();
                    sectRow = Math.floor( row / this.sectSize );
                    sectCol = Math.floor( col / this.sectSize );
                    sectIndex = ( row % this.sectSize ) * this.sectSize
                        + ( col % this.sectSize );

                    // Clear all the data associated 
                    this.$inputCells[row][col].val( '' );
                    this.setMatrixEntry( '', row, col );
                    
                    ++clearedCells;

                    // Remove the symmetric cell if we're not on the diagonal
                    if ( row !== col ) {
                        symVal = this.$inputCells[col][row].val();
                        symSectIndex = ( col % this.sectSize ) * this.sectSize
                            + ( row % this.sectSize );
                        
                        this.$inputCells[col][row].val( '' );
                        this.setMatrixEntry( '', col, row );

                        ++clearedCells;
                    }

                    // If this change results in no unique solution,
                    //  undo what we've done
                    if ( !this.hasUniqueSolution() ) {
                        this.$inputCells[row][col].val( val );
                        this.setMatrixEntry( val, row, col );

                        --clearedCells;

                        if ( row !== col ) {
                            this.$inputCells[col][row].val( symVal );
                            this.setMatrixEntry( symVal, col, row );
    
                            --clearedCells;
                        }
                    }
                }
            }
        },

        /**
         * Check if the current board has a unique solution
         * @returns {Boolean} true if there is a unique solution
         */
        hasUniqueSolution: function() {
            // TODO Implement this function
            return true;
        },

        /**
         * Get a list of all empty squares on the board
         * @return {Array} a list of ["row","col"] indices of
         *          empty squares in the sudoku
         */
        findAllEmptySquares: function( ) {
            var row, col;
            var emptySquares = [];

            for ( row = 0; row < this.gridSize; ++row ) {
                for ( col = 0; col < this.gridSize; ++col ) {
                    if ( this.$inputCells[row][col].val() === '' ) {
                        emptySquares.push( { row: row, col: col } );
                    }
                }
            }

            return emptySquares;
        },

        /**
         * Find an empty square in the puzzle with the smallest number of
         * legal values
         * @param {Array} emptySquares a list of all empty squares
         * @returns {Object} ["row","col"] indices of the best square to try inputting values
         * 
         */
        findBestEmptySquare: function( emptySquares ) {
            var i, legalValues, index;
            var minValues = this.gridSize;
            var potentialSquares = [];

            for ( i = 0; i < emptySquares.length; ++i ) {
                legalValues = this.findLegalValues( 
                    emptySquares[i].row, 
                    emptySquares[i].col 
                );

                if ( legalValues.length < minValues ) {
                    
                    // Clear the set of squares
                    potentialSquares = [];
                    minValues = legalValues.length;
                    
                    // If there's only one legal value, go back to fill it
                    if ( minValues === 1 ) {
                        return { 
                            square: emptySquares[i],
                            legalValues: legalValues
                        };
                    }
                    // If there's 0 legal values, we need to backtrack
                    else if ( minValues === 0 ) {
                        return null;
                    }

                    potentialSquares.push( { 
                        square: emptySquares[i],
                        legalValues: legalValues
                    } );
                }
                else if ( legalValues.length === minValues ) {
                    potentialSquares.push( {
                        square: emptySquares[i],
                        legalValues: legalValues
                    } );
                }
            }

            // return a random square from the list
            index = this.rand.nextInt( 0, potentialSquares.length );
            return potentialSquares[index];
        },

        /**
         * Find the legal values for the cell at row,col
         * @param {Number} row
         * @param {Number} col
         * @returns {Array} A list of all possible legal values for this cell
         */
        findLegalValues: function( row, col ) {
            var i, val, legalValues; 
            var sectRow = Math.floor( row / this.sectSize );
            var sectCol = Math.floor( col / this.sectSize );
    
            if ( this.gridSize === 9 ) {
                legalValues = [ '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            } else if ( this.gridSize === 16 ) {
                legalValues = [ '0', '1', '2', '3', '4', '5', '6', '7',
                                '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
            }

            // Check existing numbers in the row
            for ( i = 0; i < this.gridSize; ++i ) {
                var val = this.matrix.row[row][i];
                if ( val !== "" ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            // Check existing numbers in the col
            for ( i = 0; i < this.gridSize; ++i ) {
                var val = this.matrix.col[col][i];
                if ( val !== "" ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            // Check existing numbers in section
            for ( i = 0; i < this.gridSize; ++i ) {
                var val = this.matrix.sect[sectRow][sectCol][i];
                if ( val !== "" ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            // Check existing numbers on the diagonal, if relevant
            if ( this.config.type === "Diagonal" ) {
                if ( row === col ) {
                    for ( i = 0; i < this.gridSize; ++i ) {
                        var val = this.matrix.diag[0][i];
                        if ( val !== "" ) {
                            // Remove this value from the legal numbers array
                            if ( legalValues.indexOf( val ) > -1 ) {
                                legalValues.splice( legalValues.indexOf( val ), 1 );
                            }
                        }
                    }
                }
                if ( row + col === this.gridSize - 1 ) {
                    for ( i = 0; i < this.gridSize; ++i ) {
                        var val = this.matrix.diag[1][i];
                        if ( val !== "" ) {
                            // Remove this value from the legal numbers array
                            if ( legalValues.indexOf( val ) > -1 ) {
                                legalValues.splice( legalValues.indexOf( val ), 1 );
                            }
                        }
                    }
                }
            }

            return legalValues;
        }

    };

    return init( config );

}