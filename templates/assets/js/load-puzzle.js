$( document ).ready( function() {
    var today = new Date();
    today.setHours( 0, 0, 0, 0 );
    var tomorrow = new Date();
    tomorrow.setDate( today.getDate() + 1 );

    var config = {};
    var cookieDifficulty = $.cookie( "difficulty" );
    var cookieType = $.cookie( "type" );

    if (cookieDifficulty) {
        config.difficulty = cookieDifficulty;
    } else {
        $.cookie( "difficulty", "Medium" );
    }

    if (cookieType) {
        if ( cookieType == "Daily" ) {
            config.difficulty = "Medium";
            config.type = "Normal";
            config.seed = today.getTime();
        } else {
            config.type = cookieType;
        }
    } else {
        // no cookie set, so generate first puzzle based on daily seed.
        $.cookie( "type", "Daily", { expires: tomorrow } );
        config.difficulty = "Medium";
        config.type = "Normal";
        config.seed = today.getTime();
    }

    var game = new Sudoku( config );
    game.create();

    // Attach puzzle and functions to the page
    $( "#game-container" ).append( game.getTable() );
    $( "#solve" ).click( function() {
        game.solve();
    } );
    $( "#validate" ).click( function() {
        var complete = game.validate();
        if (complete) {
            $.ajax({
                url: "/solve",
                type: "POST",
                data: {
                    time: game.getTimer().getTime(),
                    difficulty: game.getConfig().difficulty,
                    seed: game.getConfig().seed
                },
                success: function() {
                    console.log( "Solve message sent!" );
                },
                error: function() {
                    console.log( "Error sending solve message." );
                }
            });
        }
    });
    $( "#pause" ).click( function() {
        game.pause();
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
});