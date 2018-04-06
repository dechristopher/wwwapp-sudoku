var solve;

$( document ).ready( function() {
    var today = new Date();
    today.setHours( 0, 0, 0, 0 );
    var tomorrow = new Date();
    tomorrow.setDate( today.getDate() + 1 );

    var config = {};
    var cookieDifficulty = $.cookie( "difficulty" );
    var cookieType = $.cookie( "type" );
    var cookieUID = $.cookie( "uid" );
    var cookieUsername = $.cookie( "username" );

    if (cookieDifficulty) {
        config.difficulty = cookieDifficulty;
    } else {
        $.cookie( "difficulty", "Medium" );
    }

    if (cookieType) {
        if ( cookieType == "Daily" ) {
            config.difficulty = "Medium";
			config.type = "Normal";
			if ($.cookie("type") == "Daily") {
				config.seed = Date.now();
			} else {
				config.seed = today.getTime();
			}
        } else {
			config.type = cookieType;
			config.seed = Date.now();
        }
    } else {
        // no cookie set, so generate first puzzle based on daily seed.
        $.cookie( "type", "Daily", { expires: tomorrow } );
        config.difficulty = "Medium";
        config.type = "Normal";
        config.seed = today.getTime();
    }

    if (cookieUsername) {
        $( ".loggedout" ).css( "display", "none" );
        $( ".loggedin" ).css( "display", "inline" );
        $( ".username" ).text( cookieUsername );
    } else {
        $( ".loggedout" ).css( "display", "inline" );
        $( ".loggedin" ).css( "display", "none" );
        $( "#request-login" ).text( "Please login or register to have your time submitted to the leaderboard!" );
    }

    var game = new Sudoku( config );
    game.create();
	solve = function() { game.solve(); };

    // Attach puzzle and functions to the page
    $( "#game-container" ).append( game.getTable() );
    $( "#new-puzzle" ).click( function() {
        window.location = "/";
    } );
    $( "#validate" ).click( function() {
        var complete = game.validate();
        if ( complete ) {
            // Display the solved modal
            $( "#id04" ).attr( "style", "display: block" );
            $( "#solve-time" ).text( game.getTimer().getString() );
            if ( $.cookie( "uid" ) ) {
                /*$.ajax({
                    url: "/solve",
                    type: "POST",
                    data: {
                        userID: $.cookie( "uid" ),
                        username: $.cookie( "username" ),
                        time: game.getTimer().getTime(),
                        difficulty: game.getConfig().difficulty,
                        type: game.getConfig().type,
                        seed: game.getConfig().seed
                    },
                    success: function() {
                        console.log( "Solve message sent!" );
                    },
                    error: function() {
						console.log( "Error sending solve message." );
						window.location = "/";
                    }
				});*/
				$.post("/solve",
					{
						userID: $.cookie("uid"),
						username: $.cookie("username"),
						time: game.getTimer().getTime(),
						difficulty: game.getConfig().difficulty,
						type: game.getConfig().type,
						seed: game.getConfig().seed
					},
					function (data, status) {
						alert("Data: " + data + "\nStatus: " + status);
					}
				);
            }
        }
    });
    $( "#pause" ).click( function() {
        var paused = game.pause();
        $( "#game-container" ).toggleClass( "hidden" );
        $( "#dummy-game-container" ).toggleClass( "hidden" );
        this.textContent = paused ? "Unpause" : "Pause";
    });
    $( "#reset" ).click( function() {
        game.reset();
    });

    // Daily Puzzle callback
    $( "#daily" ).click( function() {
        $.cookie( "type", "Daily", { expires: tomorrow } );
        window.location = "/";
    });

    // Difficulty drop-down callbacks
    $( "#new-easy" ).click( function() {
        $.cookie( "difficulty", "Easy" );

        if ( $.cookie( "type" ) == "Daily" ) {
            $.cookie( "type", "Normal", { expires: tomorrow } );
        }
        window.location = "/";
    });
    $( "#new-medium" ).click( function() {
        $.cookie( "difficulty", "Medium" );
        if ( $.cookie( "type" ) == "Daily" ) {
            $.cookie( "type", "Normal", { expires: tomorrow } );
        }
        window.location = "/";
    });
    $( "#new-hard" ).click( function() {
        $.cookie( "difficulty", "Hard" );
        if ( $.cookie( "type" ) == "Daily" ) {
            $.cookie( "type", "Normal", { expires: tomorrow } );
        }
        window.location = "/";
    });

    // Type drop-down callbacks
    $( "#new-normal" ).click( function() {
        $.cookie( "type", "Normal" );
        window.location = "/";
    });
    $( "#new-diagonal" ).click( function() {
        $.cookie( "type", "Diagonal" );
        window.location = "/";
    });
    $( "#new-big" ).click( function() {
        $.cookie( "type", "Big" );
        window.location = "/";
    });

    // Once everything is set up, hide the dummy board and display the real board
    $( "#game-container" ).toggleClass( "hidden" );
    $( "#dummy-game-container" ).toggleClass( "hidden" );
});

buildDummyTable = function () {
    var i, j, gridSize;
    var $table = $( "<table>" ).addClass( "sudoku-container" );
    var $tr;
    var $td;

    if ( $.cookie( "type" ) == "Big" ) {
        gridSize = 16;
        sectSize = 4;
    } else {
        gridSize = 9;
        sectSize = 3;
    }

    for ( i = 0; i < gridSize; ++i ) {
        $tr = $( "<tr>" );
        for ( j = 0; j < gridSize; ++j ) {
            $td = $( "<td>" ).append( $( "<input>" ).attr( "readonly", "readonly" ) );

            // This adds the inner puzzle border styles
            if ( i !== 0 && i % sectSize === 0 ) {
                $td.addClass( "sudoku-section-top" );
            }
            if ( j !== 0 && j % sectSize === 0 ) {
                $td.addClass( "sudoku-section-left" );
            }

            $tr.append( $td );
        }

        $table.append( $tr );
    }
    return $table;
}