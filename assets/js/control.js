///////////////file open dialog///////////////////////

$(document).on('change', '.btn-file :file', function () {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
    var musicXML = 'Musics/' + label;
    //playBack();
});


$(document).ready(function () {
    $('.btn-file :file').on('fileselect', function (event, numFiles, label) {

        var input = $(this).parents('.input-group').find(':text'),
            log = numFiles > 1 ? numFiles + ' files selected' : label;

        if (input.length) {
            input.val(log);
        } else {
            if (log) alert(log);
        }

    });
});

$('#fullscreen').click(function () {
    $('#fscr').click();
});
$('#stop').click(function () {
});
var looping = false;
$('#looping').click(function (e) {
    e.preventDefault();
    looping = !looping;
    if (looping) {
        $('#looping').closest('li').addClass('active');
        audioCtx.loop = false;
    }
    else {
        $('#looping').closest('li').removeClass('active');
        audioCtx.loop = true;
    }
});
var metronoming = false;
$('#metronome').click(function (e) {
    e.preventDefault();
    metronoming = !metronoming;
    $('#startstop').click();
    if (metronoming) {
        $('#metronome').closest('li').addClass('active');
    }
    else {
        $('#metronome').closest('li').removeClass('active');
    }
});

$('#playbackSpeedSelector a').click(function () {
    var playbackSpeed = $(this).data('value');
    at.alphaTab('playbackSpeed', playbackSpeed);
    $('#playbackSpeed').text($(this).text());
});

$("#playbackSpeed").slider({
    precision: 2,
    min: 0.2,
    max: 2,
    step: 0.2,
    value: 1 // Slider will instantiate showing 8.12 due to specified precision
});
var playbackSpeed = $('#playbackSpeed').val();
$('.tooltip .tooltip-inner').text(playbackSpeed + 'X');


$('#playbackSpeed').on('slide', function (val) {
    var playbackSpeed = $(this).val();
});
$('#playbackSpeed').on('mouseover', function (val) {
    var playbackSpeed = $(this).val();
});


$("#playVolume").slider({
    precision: 2,
    min: 0,
    max: 10,
    step: 1,
    value: 10 // Slider will instantiate showing 8.12 due to specified precision
});
$('#playVolume').on('slideStop', function (val) {
    var playVolume = $(this).val() / 10;
    volCorJS = playVolume / 32;
    volCorSF = playVolume / 60;
});