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
function Sudoku( config ) {
    var $table;
    var _game;
    var timer; // TODO Create a timer object
    var counter = 0;
    
    /**
     * Default configuration information
     */
    var defaultConfig = {
        // The size of the full sudoku puzzle
        // 9 is the standard sudoku size
        gridSize: 9,
        // The size of a section of the sudoku puzzle
        // must be the square root of the gridSize
        sectSize: 3,
        // The seed value of this puzzle
        // A specific seed will produce only one puzzle every time
        // Must be an integer > 0.
        // If = 0, a random seed is generated when the puzzle is created
        seed: 0,
        // Specifies the difficulty of this puzzle
        // options are "easy", "medium", "hard"
        difficulty: "easy"
    }

    /** 
     * Initialize the Sudoku object
     * @param {Object} config configuration data
     * @returns {Object} public methods
    */
    var init = function( config ) {
        var conf = $.extend( {}, defaultConfig, config );
        _game = new Game( conf );

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
                return timer;
            },

            /**
             * Reset the game board
             */
            reset: function() {
                _game.resetPuzzle();
            },

            /**
             * Check the validation of the sudoku board
             * @returns {Boolean} whether the sudoku board is valid
             */
            validate: function() {
                var isValid = _game.validatePuzzle();
                $( ".sudoku-container" ).toggleClass( "valid-matrix", isValid );
                return isValid;
            },

            /**
             * Create the sudoku puzzle
             */
            create: function() {
                _game.createPuzzle();
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
                // TODO Toggle the timer being active
                // TODO Toggle the visibility of the puzzle
            }
        };
    }

    /**
     * Sudoku game engine
     * @param {Object} config configuration data
     */
    function Game( config ) {
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

            for ( i = 0; i < this.config.gridSize; ++i ) {
                $tr = $( "<tr>" );
                this.$inputCells[i] = {};

                for ( j = 0; j < this.config.gridSize; ++j ) {
                    this.$inputCells[i][j] = $( "<input>" )
                        .attr( "maxlength", 1 )
                        .data( "row", i )
                        .data( "col", j )
                        .on( "input", $.proxy( this.onInput, this ) );

                    $td = $( "<td>" ).append( this.$inputCells[i][j] );
                    
                    // Style the sections in a checkerboard pattern
                    var sectRow = Math.floor( i / this.config.sectSize );
                    var sectCol = Math.floor( j / this.config.sectSize );
                    if ( ( sectRow + sectCol ) % 2 === 0 ) {
                        $td.addClass( "sudoku-section-one" );
                    } else {
                        $td.addClass( "sudoku-section-two" );
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
            var val, row, col, sectRow, sectCol, sectIndex, oldVal;

            val = $( e.currentTarget ).val();
            row = $( e.currentTarget ).data( "row" );
            col = $( e.currentTarget ).data( "col" );

            // Calculate which section we are in
            sectRow = Math.floor( row / this.config.sectSize );
            sectCol = Math.floor( col / this.config.sectSize );
            sectIndex = ( row % this.config.sectSize ) * this.config.sectSize + ( col % this.config.sectSize );

            // Discard non-numeric inputs
            if ( !$.isNumeric( val ) ) {
                val = "";
                $( e.currentTarget ).val( "" );
            }

            // Store the value in the solution matrix
            this.matrix.row[row][col] = val;
            this.matrix.col[col][row] = val;
            this.matrix.sect[sectRow][sectCol][sectIndex] = val;
        },

        /**
         * Clear all the user entries from the puzzle
         */
        resetPuzzle: function() {
            var row, col, sectRow, sectCol, sectIndex, val;
            this.resetMatrices();
            for ( row = 0; row < this.config.gridSize; ++row ) {
                for ( col = 0; col < this.config.gridSize; ++col ) {
                    // If the input is read-only, repopulate the matrices
                    // otherwise, clear the input
                    if ( this.$inputCells[row][col].readonly ) {
                        val = this.$inputCells[row][col].val();
                        sectRow = Math.floor( row / this.config.sectSize );
                        sectCol = Math.floor( col / this.config.sectSize );

                        this.matrix.row[row][col] = val;
                        this.matrix.col[col][row] = val;
                        this.matrix.sect[sectRow][sectCol][sectIndex] = val;
                    } else {
                        this.$inputCells[row][col].val( "" );
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

            for ( i = 0; i < this.config.gridSize; ++i ) {
                this.matrix.row[i] = [ '', '', '', '', '', '', '', '', '' ];
                this.matrix.col[i] = [ '', '', '', '', '', '', '', '', '' ];
                this.validation.row[i] = [];
                this.validation.col[i] = [];
            }
            
            for ( i = 0; i < this.config.sectSize; ++i ) {
                this.matrix.sect[i] = [];
                this.validation.sect[i] = [];
                for ( j = 0; j < this.config.sectSize; ++j ) {
                    this.matrix.sect[i][j] = [ '', '', '', '', '', '', '', '', '' ];
                    this.validation.sect[i][j] = [];
                }
            }
        },

        /**
         * Validate the numbers in the puzzle
         */
        validatePuzzle: function() {

        },

        /**
         * Creates a sudoku puzzle generated by a specified seed
         * @param {Number} seed an integer value
         */
        createPuzzle: function( seed ) {
            var row, col;

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
            for ( row = 0; row < this.config.gridSize; ++row ) {
                for ( col = 0; col < this.config.gridSize; ++col ) {
                    if ( this.$inputCells[row][col].val() !== "" ) {
                        this.$inputCells[row][col].prop( "readonly", true );
                    }
                }
            }
        },

        /**
         * Solve the sudoku puzzle. If the grid is empty, it will
         * generate a random completed sudoku
         */
        solvePuzzle: function( ) {
            var emptySquares = this.findAllEmptySquares();
            return this._solvePuzzle( emptySquares );
        },

        /**
         * Recursive method for solving the sudoku puzzle
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
            sectRow = Math.floor( row / this.config.sectSize );
            sectCol = Math.floor( col / this.config.sectSize );
            sectIndex = ( row % this.config.sectSize ) * this.config.sectSize + ( col % this.config.sectSize );

            // remove this square from the empty squares list
            emptySquares.splice( emptySquares.indexOf( next.square ), 1 );

            this.rand.shuffle( next.legalValues );
            for ( i = 0; i < next.legalValues.length; ++i ) {
                val = next.legalValues[i];

                // Update the value in the input cell
                this.$inputCells[row][col].val( val );
                // Update the value in the matrices
                this.matrix.row[row][col] = val;
                this.matrix.col[col][row] = val;
                this.matrix.sect[sectRow][sectCol][sectIndex] = val;

                // Try to solve the puzzle with the new entry in place
                if ( this._solvePuzzle( emptySquares ) ) {
                    return true;
                }
            }

            // If none of the legal numbers led to a solution, reset
            // all the values for this cell, add it back to the empty
            // squares list and return to an earlier step
            this.$inputCells[row][col].val( '' );
            this.matrix.row[row][col] = '';
            this.matrix.col[col][row] = '';
            this.matrix.sect[sectRow][sectCol][sectIndex] = '';
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
                row = this.rand.nextInt( 0, this.config.gridSize );
                col = this.rand.nextInt( 0, this.config.gridSize );
                
                // Check if this cell has already been cleared
                if ( this.$inputCells[row][col].val() !== '' ) {
                    val = this.$inputCells[row][col].val();
                    sectRow = Math.floor( row / this.config.sectSize );
                    sectCol = Math.floor( col / this.config.sectSize );
                    sectIndex = ( row % this.config.sectSize ) * this.config.sectSize
                        + ( col % this.config.sectSize );

                    // Clear all the data associated 
                    this.$inputCells[row][col].val( '' );
                    this.matrix.row[row][col] = '';
                    this.matrix.col[col][row] = '';
                    this.matrix.sect[sectRow][sectCol][sectIndex] = '';
                    
                    ++clearedCells;

                    // Remove the symmetric cell if we're not on the diagonal
                    if ( row !== col ) {
                        symVal = this.$inputCells[col][row].val();
                        symSectIndex = ( col % this.config.sectSize ) * this.config.sectSize
                            + ( row % this.config.sectSize );
                        
                        this.$inputCells[col][row].val( '' );
                        this.matrix.row[col][row] = '';
                        this.matrix.col[row][col] = '';
                        this.matrix.sect[sectCol][sectRow][symSectIndex] = '';

                        ++clearedCells;
                    }

                    // If this change results in no unique solution,
                    //  undo what we've done
                    if ( !this.hasUniqueSolution() ) {
                        this.$inputCells[row][col].val( val );
                        this.matrix.row[row][col] = val;
                        this.matrix.col[col][row] = val;
                        this.matrix.sect[sectRow][sectCol][sectIndex] = val;

                        --clearedCells;

                        if ( row !== col ) {
                            this.$inputCells[col][row].val( symVal );
                            this.matrix.row[col][row] = symVal;
                            this.matrix.col[row][col] = symVal;
                            this.matrix.sect[sectCol][sectRow][symSectIndex] = symVal;
    
                            --clearedCells;
                        }
                    }
                }
            }
        },

        /**
         * Check if the current board has a unique solution
         * @returns {Boolean} true if there is a unique solution,
         *                    false otherwise
         */
        hasUniqueSolution: function() {
            // TODO Implement this function
            return true;
        },

        /**
         * Get a list of all empty squares on the board
         */
        findAllEmptySquares: function( ) {
            var row, col;
            var emptySquares = [];

            for ( row = 0; row < this.config.gridSize; ++row ) {
                for ( col = 0; col < this.config.gridSize; ++col ) {
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
         */
        findBestEmptySquare: function( emptySquares ) {
            var i, legalValues, index;
            var minValues = this.config.gridSize;
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
         * Find the legal values for this cell
         */
        findLegalValues: function( row, col ) {
            var i, val, legalValues = []; 
            var sectRow = Math.floor( row / this.config.sectSize );
            var sectCol = Math.floor( col / this.config.sectSize );
    
            for ( i = 1; i <= this.config.gridSize; ++i ) {
                legalValues.push( i );
            }

            // Check existing numbers in the row
            for ( i = 0; i < this.config.gridSize; ++i ) {
                var val = Number( this.matrix.row[row][i] );
                if ( val > 0 ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            // Check existing numbers in the col
            for ( i = 0; i < this.config.gridSize; ++i ) {
                var val = Number( this.matrix.col[col][i] );
                if ( val > 0 ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            // Check existing numbers in section
            for ( i = 0; i < this.config.gridSize; ++i ) {
                var val = Number( this.matrix.sect[sectRow][sectCol][i] );
                if ( val > 0 ) {
                    // Remove this value from the legal numbers array
                    if ( legalValues.indexOf( val ) > -1 ) {
                        legalValues.splice( legalValues.indexOf( val ), 1 );
                    }
                }
            }

            return legalValues;
        }

    };

    return init( config );

};
