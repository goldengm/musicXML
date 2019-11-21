$(document).ready(function () {
    // Set up
    const playButtonClass = "btn btn-primary btn-round fa"; // This is the play button class name from Font Awesome
    const stopButtonClass = "btn btn-danger btn-round fa"; // This is the stop button class name from Font Awesome
    const playIcon = "&#xf04b;"; // unicode for the Font Awesome play icon
    const stopIcon = "&#xf04d;"; // unicode for the Font Awesome stop icon
    const tempoMin = 1;
    const tempoMax = 400;
    const bpbMin = 1;
    const bpbMax = 16;
    const cpbMin = bpbMin;
    const cpbMax = bpbMax;
    let beat = 1; // the current beat in the bar
    let beatsPerBar = 4;
    let clicksPerBeat = 1;
    let tempo = 60; // in beats per minute
    let isPlaying = false;
    let interval; // used to hold the setInterval data so it can be cleared when the metronome stops

    // Initialize the values in the views on the page
    $("#tempo-text-box").val(tempo);
    $("#bpb-text-box").val(beatsPerBar);
    $("#cpb-text-box").val(clicksPerBeat);

    const playStopButton = $("#metronome");


    // Create the sound effects
    // Howler.js was used to enable overlapping sound effects
    let highBlockSound = new Howl({
        //src: ["assets/sounds/High-Wood-Block.mp3"]
        src: ["https://raw.githubusercontent.com/wilson428/metronome/master/tick.wav"]
    });

    let lowBlockSound = new Howl({
        src: ["https://raw.githubusercontent.com/wilson428/metronome/master/tick.wav"]
    });

    let subdivisionLowBlockSound = new Howl({
        src: ["https://raw.githubusercontent.com/wilson428/metronome/master/tick.wav"]
    });

    // Input validation for the tempo text box
    // Makes sure that the value is between tempoMin and tempoMax
    $("#tempo-text-box").on("input", function () {
        let newTempo = $(this).val();

        if (newTempo > tempoMax) {
            newTempo = tempoMax;
            $(this).val(newTempo);
        } else if (newTempo < tempoMin) {
            newTempo = tempoMin;
            $(this).val(newTempo);
        }

       tempo = newTempo;
    });

    // Input validation for the beats per bar text box
    // Makes sure that the value is between bpbMin and bpbMax
    $("#bpb-text-box").on("input", function () {
       let newBPB = $(this).val();

       if (newBPB > bpbMax) {
           newBPB = bpbMax;
           $(this).val(newBPB);
       } else if (newBPB < bpbMin) {
           newBPB = bpbMin;
           $(this).val(newBPB);
       }

       beatsPerBar = newBPB;
    });

    // Input validation for the clicks per beat text box
    // Makes sure that the value is between cpbMin and cpbMax
    $("#cpb-text-box").on("input", function () {
       let newCPB = $(this).val();

       if (newCPB > cpbMax) {
           newCPB = cpbMax;
           $(this).val(newCPB);
       } else if (newCPB < cpbMin) {
           newCPB = cpbMin;
           $(this).val(newCPB);
       }

       clicksPerBeat = newCPB;
    });

    // Function to handle starting and stopping the metronome
    playStopButton.click(function () {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playClick();
            interval = setInterval(playClick, (60000 / tempo) / clicksPerBeat);
        } else {
            clearInterval(interval); // this stops the sound effects from playing
            //btnIcon.attr("class", playButtonClass); // change the button to the play class
            beat = 1; // reset the beat to the down beat
        }
    });

    var curSpeed = 100;
    $('#playbackSpeed').on('slideStop', function (val) {
        console.log($(this).val());
        var playbackSpeed = $(this).val();
        //$('.tooltip .tooltip-inner').text(playbackSpeed / 100 - 1 + 'X');
        //setTempo((playbackSpeed - curSpeed));
        //curSpeed = playbackSpeed;
        metronTempo = playbackSpeed;
        setTempo(metronTempo);

        clearInterval(interval); // this stops the sound effects from playing
        //btnIcon.attr("class", playButtonClass); // change the button to the play class
        beat = 1; // reset the beat to the down beat
        if (isPlaying) {
            playClick();
            clicksPerBeat = playbackSpeed;
            interval = setInterval(playClick, (60000 / tempo) / clicksPerBeat);
        }

    });
    // This function handles playing the click sound
    // Each time playClick() is called, the beat variable is incremented so we know what beat we're on
    function playClick() {
        if ((beat % (beatsPerBar * clicksPerBeat)) === 1) {
            // We're on the down beat of the bar
            highBlockSound.play();
        } else if (((beat % clicksPerBeat) === 1) || (clicksPerBeat === 1)) {
            // We're on a strong beat (aside from the down beat)
            lowBlockSound.play();
        } else {
            // We're on a subdivision of the beat
            subdivisionLowBlockSound.play();
        }
        beat++;
    }
});