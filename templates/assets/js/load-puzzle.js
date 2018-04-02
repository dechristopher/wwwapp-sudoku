$( document ).ready( function() {
    var config = {};
    var cookieDifficulty = $.cookie( "difficulty" );
    var cookieType = $.cookie( "type" );

    if (cookieDifficulty) {
        config.difficulty = cookieDifficulty;
    } else {
        $.cookie( "difficulty", "Easy" );
    }

    if (cookieType) {
        if (cookieType == "Daily") {
            var today = new Date();
            today.setHours( 0, 0, 0, 0 );
            config.type = "Normal";
            confi.difficulty = "Normal";
            config.seed = today.getTime();
        }
    } else {
        var tomorrow = new Date();
        tomorrow.setDate( tomorrow.getDate() + 1 );
        tomorrow.setHours( 0, 0, 0, 0 );
        $.cookie( "type", "Normal", { expires: tomorrow } );
        config.type = "Normal";
    }

    var game = new Sudoku( config );
    game.create();
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
});