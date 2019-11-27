//~ Revision: 96, Copyright (C) 2016-2018: Willem Vree, contributions StÃ©phane David.
//~ This program is free software; you can redistribute it and/or modify it under the terms of the
//~ GNU General Public License as published by the Free Software Foundation; either version 2 of
//~ the License, or (at your option) any later version.
//~ This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
//~ without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
//~ See the GNU General Public License for more details. <http://www.gnu.org/licenses/gpl.html>.

'use strict'
var xmlplay_VERSION = 96;
var instUrl = '';   // path to directory containing sound fonts
var instTab = {};   // { instrument number -> instrument name } for non standard instrument names


    var gAbcSave, gAbcTxt, opt = {}, allNotes, gBeats, gStaves, nVoices, scoreFnm;
    var iSeq = 0, iSeqStart, isPlaying = 0, timer1, gToSynth = 0, hasSmooth;
    var ntsSeq = [];
    var gTrans = [];    // playback transposition for each voice
    var barTimes = {};
    var ntsPos = {};    // {abc_char_pos -> nSvg, x, y, w, h}
    var stfPos = [];    // [stfys for each svg]
    var deSvgs = [], deSvgGs = [];
    var twoSys;
    var topSpace = 500, gScale;
    var dottedHeight = 30;
    var curStaff = 0;
    var isvgPrev = [];  // svg index of each marker
    var issvgHoriz = false;
    var scrollchkHorizCnt = 0;
    var prevHorizVal = 0;
    var isvgAligned = 0;
    var totalInstancesGlb = 1;
    var rMarks = [];    // a marker for each voice
    var audioCtx = null;
    var golven = [];
    var liggend = [];
    var midiLoaded = {};    // midi nums of already loaded waves
    var notationHeight = 100;
    var fileURL = '';
    var drop_files = null;
    var stfHgt = [];
    var noSf2 = {};     // { n: boolean }, no local javascript font for instrument n
    var noMidiJs = {};  // { n: boolean }, no local midi-js font for instrument n
    var instSf2Loaded = {};
    var instArr = [];   // { note_name -> b64 encoded compressed audio } for each loaded instrument
    var mapTab = {};    // { map_name + ABC_note -> midi_number }
    var midiVol = [];   // volume for each voice from midi controller 7
    var midiPan = [];   // panning for each voice from midi controller 10
    var gTunings = {};  // string tuning per voice
    var gDiafret = {};  // diatonic fretting per voice (0 = chromatic, 1 = diatonic)
    var abcElm = null;  // contains the svg elements (score)
    var cmpDlg, errElm, abcfile, rolElm, fknElm, tmpElm, drpuse, drplbl, mbar, menu, playbk, playbtn, stopbtn;
    var alrtMsg2 = 'Your browser has no Web Audio API -> no playback.'
    var	inst_tb = [ "acoustic_bass", "acoustic_grand_piano", "bright_acoustic_piano", "electric_grand_piano",
        "honkytonk_piano", "electric_piano_1", "electric_piano_2", "harpsichord", "clavinet", "celesta",
        "glockenspiel", "music_box", "vibraphone", "marimba", "xylophone", "tubular_bells", "dulcimer",
        "drawbar_organ", "percussive_organ", "rock_organ", "church_organ", "reed_organ", "accordion",
        "harmonica", "tango_accordion", "acoustic_guitar_nylon", "acoustic_guitar_steel",
        "electric_guitar_jazz", "electric_guitar_clean", "electric_guitar_muted", "overdriven_guitar",
        "distortion_guitar", "guitar_harmonics",  "electric_bass_finger",
        "electric_bass_pick", "fretless_bass", "slap_bass_1", "slap_bass_2", "synth_bass_1",
        "synth_bass_2", "violin", "viola", "cello", "contrabass", "tremolo_strings", "pizzicato_strings",
        "orchestral_harp", "timpani", "string_ensemble_1", "string_ensemble_2", "synth_strings_1",
        "synth_strings_2", "choir_aahs", "voice_oohs", "synth_choir", "orchestra_hit", "trumpet",
        "trombone", "tuba", "muted_trumpet", "french_horn", "brass_section", "synth_brass_1",
        "synth_brass_2", "soprano_sax", "alto_sax", "tenor_sax", "baritone_sax", "oboe", "english_horn",
        "bassoon", "clarinet", "piccolo", "flute", "recorder", "pan_flute", "blown_bottle", "shakuhachi",
        "whistle", "ocarina", "lead_1_square", "lead_2_sawtooth", "lead_3_calliope", "lead_4_chiff",
        "lead_5_charang", "lead_6_voice", "lead_7_fifths", "lead_8_bass__lead", "pad_1_new_age",
        "pad_2_warm", "pad_3_polysynth", "pad_4_choir", "pad_5_bowed", "pad_6_metallic", "pad_7_halo",
        "pad_8_sweep", "fx_1_rain", "fx_2_soundtrack", "fx_3_crystal", "fx_4_atmosphere",
        "fx_5_brightness", "fx_6_goblins", "fx_7_echoes", "fx_8_scifi", "sitar", "banjo", "shamisen",
        "koto", "kalimba", "bagpipe", "fiddle", "shanai", "tinkle_bell", "agogo", "steel_drums",
        "woodblock", "taiko_drum", "melodic_tom", "synth_drum", "reverse_cymbal", "guitar_fret_noise",
        "breath_noise", "seashore", "bird_tweet", "telephone_ring", "helicopter", "applause","gunshot"]
    var urlLoaded = {}; // onthoud welke scripts geladen zijn
    var gTempo = 120, curTemp = 120, tempScale = 1;
    var params = [];    // [instr][key] note parameters per instrument
    var rates = [];     // [instr][key] playback rates
    var withRT = 1;     // enable real time synthesis, otherwise pre-rendered waves (MIDIjs)
    var noPF = 0;       // do not translate xml page format
    var noLB = 0;       // do not translate xml line breaks
    var gCurMask = 0;   // cursor mask (0-255)
    var volCorJS = 1 / 32;  // volume scaling factor for midiJS
    var volCorSF = 1 / 60;  // idem for Sf2 (60 == volume of !p!)
    var hasPan = 1, hasLFO = 1, hasFlt = 1, hasVCF = 1; // web audio api support

function logerr (s) { errElm.innerHTML += s + '\n'; }

function readAbcOrXML (abctxt) {
    var xs = abctxt.slice (0, 4000);    // only look at the beginning of the file
    if (xs.indexOf ('X:') >= 0)      { dolayout (abctxt); return }
    if (xs.indexOf ('<?xml ') == -1) { alert ('not an xml file nor an abc file'); return }
    var p = new window.DOMParser ();
    var xmldata = p.parseFromString (abctxt, "text/xml")
    var options = { p:'f', t:1, u:0, v:3, m:2, mnum:0 };    // t==1 -> tab en perc naar %%map
    if (noPF) options.p = '';
    if (noLB) options.x = 1;
    var res = vertaal (xmldata, options);
    if (res[1]) logerr (res[1]);
    dolayout (res[0]);
}

function readLocalFile () {
    var f, freader = new FileReader ();
    freader.onload = function (e) { readAbcOrXML (freader.result); }
    if (drop_files) f = drop_files [0]
    else            f = fknElm.files [0];
    if (f) {
        resetInstrumentArr();
        scoreFnm = f.name.split ('.')[0];
        freader.readAsText (f);
        playBack();
    }
}

function readDbxFile (files) {
    errElm.innerHTML = '';    // clear error output area
    var url = files[0].link;
    scoreFnm = files[0].name.split ('.')[0];
    cmpDlg.style.display = 'block';
    logerr ('link: ' + url + '<br>');
    var request = new XMLHttpRequest ();
    request.open ('GET', url, true);
    request.onload = function () {
        logerr ('XHR ok');
        cmpDlg.style.display = 'none';
        readAbcOrXML (request.responseText);
    }
    request.onerror = function () { cmpDlg.innerHTML += 'XHR failed<br>'; }
    request.send();
}

function doDrop (e) {
    e.stopPropagation ();
    e.preventDefault ();
    drop_files = e.dataTransfer.files;
    this.classList.remove ('indrag');
    readLocalFile ();
}

function dolayout (abctxt) {
    function stringTunings (abcIn) {
        var ls, i, x, r, vce, bstep, boct, mnum, tuning = {}, vid, diafret = {};
        var steps = [18, 20, 22, 24, 26, 28];   // apit van iedere snaar
        ls = abcIn.split ('\n');
        for (i = 0; i < ls.length; ++i) {
            x = ls [i];
            if (x.indexOf ('strings') >= 0) {
                r = x.match (/V:\s*(\S+).*strings\s*=\s*(\S+)/);   // ?? voice optional with error msg
                if (r) {
                    vid = r[1];         // real voice id
                    tuning [vid] = {};  // { apit snaar -> midi number }
                    r[2].split (',').forEach (function (n, ix) {
                        bstep = n[0]
                        boct = parseInt (n[1]) * 12;
                        mnum = boct + [0,2,4,5,7,9,11]['CDEFGAB'.indexOf (bstep)] + 12  // + capo ??
                        tuning [vid] [steps [ix]] = mnum;
                    });
                    diafret [vid] = x.indexOf ('diafret') >= 0;
                }
            }
        }
        return [tuning, diafret];
    }
    function mapPerc (abcIn) {
        var ls, i, x, r, mapName, note, midi, mtab = {};
        ls = abcIn.split ('\n');
        for (i = 0; i < ls.length; ++i) {
            x = ls [i];
            if (x.indexOf ('%%map') >= 0) {
                r = x.match(/%%map *(\S+) *(\S+).*midi=(\d+)/)
                if (r) {
                    mapName = r[1]; note = r[2]; midi = r[3];
                    mtab [mapName + note] = parseInt (midi);
                }
            }
        }
        return mtab;
    }
    function perc2map (abcIn) {
        var b = '%%beginsvg\n<defs>\n'
        b+= '<text id="x" x="-3" y="0">&#xe263;</text>\n'
        b+= '<text id="x-" x="-3" y="0">&#xe263;</text>\n'
        b+= '<text id="x+" x="-3" y="0">&#xe263;</text>\n'
        b+= '<text id="normal" x="-3.7" y="0">&#xe0a3;</text>\n'
        b+= '<text id="normal-" x="-3.7" y="0">&#xe0a3;</text>\n'
        b+= '<text id="normal+" x="-3.7" y="0">&#xe0a4;</text>\n'
        b+= '<g id="circle-x"><text x="-3" y="0">&#xe263;</text><circle r="4" class="stroke"/></g>\n'
        b+= '<g id="circle-x-"><text x="-3" y="0">&#xe263;</text><circle r="4" class="stroke"/></g>\n'
        b+= '<path id="triangle" d="m-4 -3.2l4 6.4 4 -6.4z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="triangle-" d="m-4 -3.2l4 6.4 4 -6.4z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="triangle+" d="m-4 -3.2l4 6.4 4 -6.4z" class="stroke" style="fill:#000"/>\n'
        b+= '<path id="square" d="m-3.5 3l0 -6.2 7.2 0 0 6.2z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="square-" d="m-3.5 3l0 -6.2 7.2 0 0 6.2z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="square+" d="m-3.5 3l0 -6.2 7.2 0 0 6.2z" class="stroke" style="fill:#000"/>\n'
        b+= '<path id="diamond" d="m0 -3l4.2 3.2 -4.2 3.2 -4.2 -3.2z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="diamond-" d="m0 -3l4.2 3.2 -4.2 3.2 -4.2 -3.2z" class="stroke" style="stroke-width:1.4"/>\n'
        b+= '<path id="diamond+" d="m0 -3l4.2 3.2 -4.2 3.2 -4.2 -3.2z" class="stroke" style="fill:#000"/>\n'
        b+= '</defs>\n%%endsvg'
        var fillmap = {'diamond':1, 'triangle':1, 'square':1, 'normal':1};
        var abc = [b], ls, i, x, r, id='default', maps = {'default':[]};
        ls = abcIn.split ('\n');
        for (i = 0; i < ls.length; ++i) {
            x = ls [i];
            if (x.indexOf ('I:percmap') >= 0) {
                x = x.split (' ');
                var kop = x[4];
                if (kop in fillmap) kop = kop + '+' + ',' + kop;
                x = '%%map perc'+id+ ' ' +x[1]+' print=' +x[2]+ ' midi=' +x[3]+ ' heads=' + kop;
                maps [id].push (x);
            }
            if (x.indexOf ('V:') >= 0) {
                r = x.match (/V:\s*(\S+)/);
                if (r) {
                    id = r[1];
                    if (!(id in maps)) maps [id] = [];
                }
            }
        }
        for (id in maps) abc = abc.concat (maps [id]);
        for (i = 0; i < ls.length; ++i) {
            x = ls [i];
            if (x.indexOf ('I:percmap') >= 0) continue;
            if (x.indexOf ('V:') >= 0 || x.indexOf ('K:') >= 0) {
                r = x.match (/V:\s*(\S+)/);
                if (r) id = r[1];
                if (maps [id].length == 0) id = 'default';
                abc.push (x);
                if (x.indexOf ('perc') >= 0 && x.indexOf ('map=') == -1) x += ' map=perc';
                if (x.indexOf ('map=perc') >= 0 && maps [id].length > 0) abc.push ('%%voicemap perc' + id);
                if (x.indexOf ('map=off') >= 0) abc.push ('%%voicemap');
            }
            else abc.push (x);
        }
        return abc.join ('\n');
    }

    if (abctxt.indexOf ('I:percmap') >= 0) abctxt = perc2map (abctxt);
    if (abctxt.indexOf ('%%map') >= 0) mapTab = mapPerc (abctxt);
    if (abctxt.indexOf (' strings') >= 0) {
        var tns = stringTunings (abctxt);
        gTunings = tns [0];
        gDiafret = tns [1];
    }
    gAbcSave = abctxt;  // bewaar abc met wijzigingen

    abctxt = abctxt.replace(/snm=\".*\"/g, 'snm=""');
    abctxt = abctxt.replace(/nm=\".*\"/g, 'nm=""');


    doModel (abctxt);
    doLayout (abctxt);
    
    $("div#notation").css('overflow-x', 'inherit').css('white-space', 'inherit');
    $('li#notesgap').hide();
    $('li#notesgap2').show();
    $("input[name=optradioPosition][value='0']").prop("checked",true);
    $("div#notation").css('overflow-x', 'inherit').css('overflow-y', 'auto').css('height', '600px').css('white-space', 'inherit');
    isPlaying=0;
    $('button#play').val('Play');
    clearTimeout (timer1);

    $('button#stop').click(function() {
            isPlaying=0;
            $('button#play').val('Play');
            clearTimeout (timer1);
            if(!issvgHoriz){
                $('svg.music').remove();
                $('div#leeg').remove();
                $("div#notation").css('overflow-x', 'inherit').css('overflow-y', 'auto').css('height', '600px').css('white-space', 'inherit');
                $('li#notesgap').hide();
                $('li#notesgap2').show();
                prevHorizVal = 0;

                doModel (abctxt);
                doLayout (abctxt);
            }else{
                $('svg.music').remove();
                $('div#leeg').remove();
                $("div#notation").css('overflow-x', 'auto').css('overflow-y', 'inherit').css('height', 'inherit').css('white-space', 'nowrap');
                $('li#notesgap').show();
                $('li#notesgap2').hide();
                prevHorizVal = 0;
                var abctxtHoriz = '';
                abctxtHoriz = abctxt.replace('I:linebreak $', "%%singleline 1");
                doModel (abctxtHoriz);
                doLayoutHoriz (abctxtHoriz);
            }
        });



       $('input[type=radio][name=optradioPosition]').change(function() {
        if (this.value == 0) {
            $('svg.music').remove();
            $('div#leeg').remove();
            $("div#notation").css('overflow-x', 'inherit').css('overflow-y', 'auto').css('height', '600px').css('white-space', 'inherit');
            $('li#notesgap').hide();
            $('li#notesgap2').show();
            isPlaying=0;
            $('button#play').val('Play');
            clearTimeout (timer1);
            issvgHoriz = false;
            prevHorizVal = 0;
            doModel (abctxt);
            doLayout (abctxt);
        }
        else if (this.value == 1) {
            $('svg.music').remove();
            $('div#leeg').remove();
            $("div#notation").css('overflow-x', 'auto').css('overflow-y', 'inherit').css('height', 'inherit').css('white-space', 'nowrap');
            $('li#notesgap').show();
            $('li#notesgap2').hide();
            isPlaying=0;
            $('button#play').val('Play');
            clearTimeout (timer1);
            issvgHoriz = true;
            prevHorizVal = 0;
            var abctxtHoriz = '';
            abctxtHoriz = abctxt.replace('I:linebreak $', "%%singleline 1");
            //var abctxtHorizT = abctxt.split('I:linebreak $');
            //abctxtHorizT[1] = abctxtHorizT[1].split('$').join("");
            //abctxtHoriz = abctxtHorizT.join('I:linebreak ?');
            //console.log(abctxtHoriz);

            doModel (abctxtHoriz);
            doLayoutHoriz (abctxtHoriz);
        }
    });

}

function doModel (abctxt) {
    var abc2svg;
    var errtxt = '';
    var BAR = 0, GRACE = 4, KEY = 5, METER = 6, NOTE = 8, REST = 10, TEMPO = 14, BLOCK = 16, BASE_LEN = 1536;
    var keySteps = [3,0,4,1,5,2,6];     // step values of the cycle of fifth
    var scaleSteps = [0,2,4,5,7,9,11];  // step values of the scale of C
    gAbcTxt = abctxt;
    allNotes = [];
    gTrans = [];
    tmpElm.value = curTemp = gTempo = 120;
    midiVol = [];       // volume for each voice from midi controller 7
    midiPan = [];       // panning for each voice from midi controller 10
    var midiInstr = []; // instrument for each voice from midi program

    function getStaves (voice_tb) {
        var xs = [];
        voice_tb.forEach (function (v, i) {
            if (xs [v.st]) xs [v.st].push (i);
            else xs [v.st] = [i];
            if (v.clef.clef_octave) gTrans [i] = v.clef.clef_octave;
            stfHgt [v.st] = (v.stafflines || '|||||').length * 6 * (v.staffscale || 1);
            midiVol [i] = v.midictl && v.midictl [7];
            if (midiVol [i] == undefined) midiVol [i] = 100;
            midiPan [i] = v.midictl && v.midictl [10];
            if (midiPan [i] == undefined) midiPan [i] = 64;
            midiInstr[i] = v.instr ? v.instr : 0;
            
        });
        
        return xs;
    }

    function errmsg (txt, line, col) {
        errtxt += txt + '\n';
    }

    function parseModel (ts_p, voice_tb, music_types) {
        function setKey (v, sharpness) {    // voice, index in cycle of fifth (keySteps)
            acctab [v] = [0,0,0,0,0,0,0];   // step modifications for the current key in voice v
            alts [v] = {};                  // reset alterations
            curKey [v] = sharpness;
            var sign = sharpness >= 0;
            var accs = sign ? keySteps.slice (0, sharpness) : keySteps.slice (sharpness);   // steps modified by key
            accs.forEach (function (iacc) { acctab [v][iacc] += sign ? 1 : -1; });          // perform modification in acctab
        }
        var acctab = {}, accTrans = {'-2':-2,'-1':-1,0:0,1:1,2:2,3:0}, alts = {}, curKey = {}, tied = {};
        var diamap = '0,1-,1,1+,2,3,3,4,4,5,6,6+,7,8-,8,8+,9,10,10,11,11,12,13,13+,14'.split (',')
        var dyntab = {'ppp':30, 'pp':45, 'p':60, 'mp':75, 'mf':90, 'f':105, 'ff':120, 'fff':127}
        var vceVol = [], vol;
        var mtr = voice_tb [0].meter.a_meter;
        gBeats = mtr.length ? parseInt (mtr [0].top) : 4;
        for (v = 0; v < voice_tb.length; ++v) {
            var key = voice_tb [v].key.k_sf;
            setKey (v, key);
            tied [v] = {};
        }
        var midiUsed = {};
        nVoices = voice_tb.length;
        gStaves = getStaves (voice_tb);
        for (var ts = ts_p; ts; ts = ts.ts_next) {
            var i, n, p, oct, step, mn, noten = [], noot, fret, tuning, v, vid;
            switch (ts.type) {
            case TEMPO:
                var dtmp = ts.tempo_notes.reduce (function (sum, x) { return sum + x; });
                gTempo = ts.tempo * dtmp / 384;
                if (ts.time == 0) tmpElm.value = curTemp = gTempo;
                break;
            case REST:
                noot = { t: ts.time, mnum: -1, dur: ts.dur };
                noten.push (noot);
                allNotes.push ({ t: ts.time, ix: ts.istart, v: ts.v, ns: noten, inv: ts.invis, tmp: gTempo });
                break;
            case NOTE:
                var instr = midiInstr [ts.v];   // from %%MIDI program instr
                if (ts.p_v.clef.clef_type == 'p') instr += 128;  // percussion
                for (i = 0; i < ts.notes.length; ++i) { // parse all notes (chords)
                    n = ts.notes [i];
                    p = n.pit + 19;             // C -> 35 == 5 * 7, global step
                    v = ts.v;                   // voice number 0..
                    vid = ts.p_v.id;            // voice ID
                    if (ts.a_dd)
                        ts.a_dd.forEach (function (r) { // check all deco's
                            vol = dyntab [r.name];      // volume of deco (if defined)
                            if (vol) {          // set all voices of staff to volume
                                gStaves [ts.st].forEach (function (vce) {
                                    vceVol [vce] = vol; // array of current volumes
                                });
                            }
                        });
                    vol = vceVol [v] || 60;     // 60 == !p! if no volume
                    if (gTrans [v]) p += gTrans [v];    // octaaf transpositie in sleutel
                    oct = Math.floor (p / 7);   // C -> 5
                    step = p % 7;               // C -> 0
                    if (n.acc != undefined) alts [v][p] = accTrans [n.acc]; // wijzig acctab voor stap p in stem ts.v
                    mn = oct * 12 + scaleSteps [step] + (p in alts [v] ? alts [v][p] : acctab [v][step]);
                    var mapNm = ts.p_v.map;
                    if (instr >= 128 && mapNm != 'MIDIdrum') {
                        var nt = abctxt.substring (ts.istart, ts.iend);
                        nt = nt.match (/[=_^]*[A-Ga-g]/)[0];
                        var x = mapTab [mapNm + nt];
                        if (x) mn = x;
                    }
                    mn = instr * 128 + mn;
                    midiUsed [mn] = 1;          // collect all used midinumbers

                    noot = { t: ts.time, mnum: mn, dur: ts.dur, velo: vol };
                    if (p in tied [v]) {
                        tied [v][p].dur += ts.dur;      // verleng duur van vorige noot
                        if (n.ti1 == 0) delete tied [v][p]; // geen verdere ties
                        continue;                       // noot wordt in feite overgeslagen
                    }
                    if (n.ti1 != 0) tied [v][p] = noot; // bewaar ref naar r om later de duur te verlengen
                    noten.push (noot);
                }
                if (noten.length == 0) break;           // door ties geen noten meer over
                allNotes.push ({ t: ts.time, ix: ts.istart, v: ts.v, ns: noten, stf: ts.st, tmp: gTempo });
                break;
            case KEY: setKey (ts.v, ts.k_sf); break;    // set acctab to new key
            case BAR:
                setKey (ts.v, curKey [ts.v]);           // reset acctab to current key
                allNotes.push ({ t: ts.time, ix: ts.istart, v: ts.v, bt: ts.bar_type, tx: ts.text });
                break;
            case METER:                         // ritme verandering: nog te doen !
                //~ gBeats = parseInt (ts.a_meter [0].top);
                break;
            case BLOCK:
                if (ts.instr) midiInstr [ts.v] = ts.instr;
                if (ts.ctrl == 7) midiVol [ts.v] = ts.val;
                if (ts.ctrl == 10) midiPan [ts.v] = ts.val;
            }
        }
        rMarks.forEach (function (mark) {   // verwijder oude markeringen
            var pn = mark.parentNode;
            if (pn) pn.removeChild (mark);
        });
        isvgPrev = [];                      // clear svg indexes
        var kleur = ['#f9f','#3cf','#c99','#f66','#fc0','#cc0','#ccc'];
        for (var i = 0; i < nVoices; ++i) { // a marker for each voice
            var alpha = 1 << i & gCurMask ? '0' : ''
            var rMark = document.createElementNS ('http://www.w3.org/2000/svg','rect');
            rMark.setAttribute ('fill', kleur [i % kleur.length] + alpha);
            rMark.setAttribute ('fill-opacity', '0.5');
            rMark.setAttribute ('width', '0');  // omdat <rect> geen standaard HTML element is werkt rMark.width = 0 niet.
            rMarks.push (rMark);
            isvgPrev.push (-1);
        }
        if (audioCtx != null) laadNootHulp (midiUsed);  // laad de golfdata van de benodigde midinummers
        else alert (alrtMsg2);
    }

    var user = {
        'img_out': null, // img_out,
        'errmsg': errmsg,
        'read_file': function (x) { return ''; },   // %%abc-include, unused
        'anno_start': null, // svgInfo,
        'get_abcmodel': parseModel
    }
    abc2svg = new Abc (user);
    abc2svg.tosvg ('play', '%%play');   // houdt rekening met transpose= in K: of V:
    abc2svg.tosvg ('abc2svg', abctxt);
    if (errtxt == '') errtxt = 'no error';
    logerr (errtxt);
}

function doLayoutHoriz (abctxt) {
    var abc2svg;
    var muziek = '';
    var errtxt = '';
    var nSvg = 0;
    iSeq = 0;
    iSeqStart = 0;
    ntsPos = {};    // {abc_char_pos -> nSvg, x, y, w, h}
    stfPos = [];    // [stfys for each svg]
    var stfys = {}; // y coors of the bar lines in a staff
    var xleft, xright, xleftmin = 1000, xrightmax = 0;
    curStaff = 0;

    function errmsg (txt, line, col) {
        errtxt += txt + '\n';
    }

    function img_out (str) {
        if (str.indexOf ('<svg') != -1) {
            stfPos [nSvg] = Object.keys (stfys);
            stfys = {}
            nSvg += 1;
            if (xleft < xleftmin) xleftmin = xleft;
            if (xright > xrightmax) xrightmax = xright;
        }
        muziek += str;
    }

    function svgInfo (type, s1, s2, x, y, w, h) {
        if (type == 'note' || type == 'rest') {
            x = abc2svg.ax (x).toFixed (2);
            y = abc2svg.ay (y).toFixed (2);
            h = abc2svg.ah (h);
            ntsPos [s1] = [nSvg, x, y, w, h];
        }
        if (type == 'bar') {
            y = abc2svg.ay (y);
            h = abc2svg.ah (h);
            y = Math.round (y + h);
            stfys [y] = 1;
            xright = abc2svg.ax (x);
            xleft = abc2svg.ax (0);
        }
    }

    function getNote (event) {
        var p, isvg, x, y, w, h, xp, jsvg, i, ys, yp, t, v;
        event.stopPropagation ();
        x = event.clientX;           // position click relative to page
        x -= this.getBoundingClientRect ().left;    // positie linker rand (van this = klikelement = svg) t.o.v. de viewPort
        xp = x * gScale;
        if (xp < xleftmin + 24 || xp > xrightmax) {  // click in the margin
            playBack ();
            return;
        }
        jsvg = deSvgs.indexOf (this);
        yp = (event.clientY - this.getBoundingClientRect ().top) * gScale;
        ys = stfPos [jsvg];
        for (i = 0; i < ys.length; i++) {
            if (ys [i] > yp) {                      // op staff i is geklikt
                curStaff = i;
                alignSystem (jsvg);
                break;
            }
        }
        for (i = 0; i < ntsSeq.length; ++i) {
            p = ntsSeq [i].xy;
            if (!p) continue;       // invisible rest
            v = ntsSeq [i].vce
            if (gStaves [curStaff].indexOf (v) == -1) continue; // stem niet in balk curStaff
            isvg = p[0]; x = p[1]; y = p[2]; w = p[3]; h = p[4];
            if (isvg < jsvg) continue;
            if (xp < parseFloat (x) + w) {
                iSeq = i;
                iSeqStart = iSeq;   // zet ook de permanente startpositie
                t = ntsSeq [i].t
                while (ntsSeq [i] && ntsSeq [i].t == t) {
                    putMarkLoc (ntsSeq [i]);
                    i += 1
                }
                break;
            }
        }
    }

    if (!abctxt) return;

    var user = {
        'imagesize': 'width="100%"',
        'img_out': img_out,
        'errmsg': errmsg,
        'read_file': function (x) { return ''; },   // %%abc-include, unused
        'anno_start': svgInfo,
        'get_abcmodel': null
    }
    abc2svg = new Abc (user);
    var totalInstancesG = (abctxt.match(/<\/g>/g) || []).length;
    abc2svg.tosvg ('abc2svg', abctxt);
    if (errtxt == '') errtxt = 'no error\n';
    logerr (errtxt);
	if (!muziek) return;

    abcElm.innerHTML = '<div id="leeg" style="height:'+ '0' +'px">&nbsp;</div>';
    abcElm.innerHTML += muziek;
    abcElm.innerHTML += '<div id="leeg" style="height:'+ '200' +'px">&nbsp;</div>';
    addUnlockListener (document.getElementById ('leeg'), 'click', playBack);
    deSvgs = Array.prototype.slice.call (abcElm.getElementsByTagName ('svg'));
    var gs = Array.prototype.slice.call (abcElm.getElementsByClassName ('g'));
    deSvgGs = gs.length ? gs : deSvgs;
    setScale ();
    deSvgs[0].style.width = totalInstancesG*100+'%';
    totalInstancesGlb = totalInstancesG*100;
    $("input#notesgapvalue").val(totalInstancesG);
    $("input#notesgapvalue").change(function() {
        deSvgs[0].style.width = $(this).val()*100+'%';
        totalInstancesGlb = $(this).val()*100;
    });
    $("svg text.f2").attr('y', $("svg text.f2").first().attr('y'));
    $("svg text.f3").attr('y', $("svg text.f3").first().attr('y'));
    deSvgs.forEach (function (svg) {
        if (twoSys) svg.style.display = 'none';   // want beide systemen worden in putMarkLoc aan gezet
        addUnlockListener (svg, 'click', getNote);
    });
    mkNtsSeq ();
}




function doLayout (abctxt) {
    var abc2svg;
    var muziek = '';
    var errtxt = '';
    var nSvg = 0;
    iSeq = 0;
    iSeqStart = 0;
    ntsPos = {};    // {abc_char_pos -> nSvg, x, y, w, h}
    stfPos = [];    // [stfys for each svg]
    var stfys = {}; // y coors of the bar lines in a staff
    var xleft, xright, xleftmin = 1000, xrightmax = 0;
    curStaff = 0;

    function errmsg (txt, line, col) {
        errtxt += txt + '\n';
    }

    function img_out (str) {
        if (str.indexOf ('<svg') != -1) {
            stfPos [nSvg] = Object.keys (stfys);
            stfys = {}
            nSvg += 1;
            if (xleft < xleftmin) xleftmin = xleft;
            if (xright > xrightmax) xrightmax = xright;
        }
        muziek += str;
    }

    function svgInfo (type, s1, s2, x, y, w, h) {
        if (type == 'note' || type == 'rest') {
            x = abc2svg.ax (x).toFixed (2);
            y = abc2svg.ay (y).toFixed (2);
            h = abc2svg.ah (h);
            ntsPos [s1] = [nSvg, x, y, w, h];
        }
        if (type == 'bar') {
            y = abc2svg.ay (y);
            h = abc2svg.ah (h);
            y = Math.round (y + h);
            stfys [y] = 1;
            xright = abc2svg.ax (x);
            xleft = abc2svg.ax (0);
        }
    }

    function getNote (event) {
        var p, isvg, x, y, w, h, xp, jsvg, i, ys, yp, t, v;
        event.stopPropagation ();
        x = event.clientX;           // position click relative to page
        x -= this.getBoundingClientRect ().left;    // positie linker rand (van this = klikelement = svg) t.o.v. de viewPort
        xp = x * gScale;
        if (xp < xleftmin + 24 || xp > xrightmax) {  // click in the margin
            playBack ();
            return;
        }
        jsvg = deSvgs.indexOf (this);
        yp = (event.clientY - this.getBoundingClientRect ().top) * gScale;
        ys = stfPos [jsvg];
        for (i = 0; i < ys.length; i++) {
            if (ys [i] > yp) {                      // op staff i is geklikt
                curStaff = i;
                alignSystem (jsvg);
                break;
            }
        }
        for (i = 0; i < ntsSeq.length; ++i) {
            p = ntsSeq [i].xy;
            if (!p) continue;       // invisible rest
            v = ntsSeq [i].vce
            if (gStaves [curStaff].indexOf (v) == -1) continue; // stem niet in balk curStaff
            isvg = p[0]; x = p[1]; y = p[2]; w = p[3]; h = p[4];
            if (isvg < jsvg) continue;
            if (xp < parseFloat (x) + w) {
                iSeq = i;
                iSeqStart = iSeq;   // zet ook de permanente startpositie
                t = ntsSeq [i].t
                while (ntsSeq [i] && ntsSeq [i].t == t) {
                    putMarkLoc (ntsSeq [i]);
                    i += 1
                }
                break;
            }
        }
    }

    if (!abctxt) return;

    var user = {
        'imagesize': 'width="100%"',
        'img_out': img_out,
        'errmsg': errmsg,
        'read_file': function (x) { return ''; },   // %%abc-include, unused
        'anno_start': svgInfo,
        'get_abcmodel': null
    }
    abc2svg = new Abc (user);
    abc2svg.tosvg ('abc2svg', abctxt);
    if (errtxt == '') errtxt = 'no error\n';
    logerr (errtxt);
    if (!muziek) return;

    abcElm.innerHTML = '<div id="leeg" style="height:'+ '0' +'px">&nbsp;</div>';
    abcElm.innerHTML += muziek;
    abcElm.innerHTML += '<div id="leeg" style="height:'+ '200' +'px">&nbsp;</div>';
    addUnlockListener (document.getElementById ('leeg'), 'click', playBack);
    deSvgs = Array.prototype.slice.call (abcElm.getElementsByTagName ('svg'));
    var gs = Array.prototype.slice.call (abcElm.getElementsByClassName ('g'));
    deSvgGs = gs.length ? gs : deSvgs;
    setScale ();
        $("input#notesgapvalue2").val(1);
        totalInstancesGlb = 100;
        $("input#notesgapvalue2").change(function() {
                var perctVert = 100 + $(this).val()*2;
                totalInstancesGlb = perctVert;
               $('svg.music').css('width', perctVert +'%');

        });
    deSvgs.forEach (function (svg) {
        if (twoSys) svg.style.display = 'none';   // want beide systemen worden in putMarkLoc aan gezet
        addUnlockListener (svg, 'click', getNote);
    });
    mkNtsSeq ();
}







function setScale () {
    if (deSvgs.length == 0) return;
    var w_svg, w_vbx, m, scale, svg = deSvgs [0];
    var w_svg = svg.getBoundingClientRect ().width;     // width svg element in pixels
    try       { w_vbx = svg.viewBox.baseVal.width; }    // width svg element (vbx coors)
    catch (e) { w_vbx = w_svg; }                        // no viewbox
    m = (m = deSvgGs [0].transform) ? m.baseVal : [];   // scale factor top g-grafic
    scale = m.numberOfItems ? m.getItem (0).matrix.a : 1;   // scale: svg-coors -> vbx-coors
    gScale = ((w_vbx / scale) / w_svg);                 // pixels -> svg-coors
}

function alignSystem (isvg) {   // uitlijnen balken met de rollijn
    var animflag = isvg != undefined;   // alleen animatie in getNote en putMarkLoc
    if (isvg == undefined) isvg = isvgAligned;
    var t = rolElm.getBoundingClientRect ().top;
    var u = deSvgs [isvg].getBoundingClientRect ().top;
    var istf = curStaff;
    var y = (stfPos [isvg][istf] - stfHgt [istf]) / gScale;
    var newTop = Math.round (abcElm.scrollTop + u + y - dottedHeight - t);
    //console.log(newTop+' ## '+ abcElm);
    if (newTop != abcElm.scrollTop) {
        if (hasSmooth) abcElm.style ['scroll-behavior'] = animflag ? 'smooth' : 'auto';
        abcElm.scrollTop = newTop;
    }
    isvgAligned = isvg;
}

function lijn_shift (evt) {
    evt.preventDefault();
    var touchDev = evt.type == 'touchstart';
    var doel = rolElm;
    doel.style.cursor = 'row-resize';
    doel.classList.add ('spel');
    function evfa (evt) {
        var h = abcElm.getBoundingClientRect ().top;
        var y = touchDev ? evt.touches[0].clientY : evt.clientY;
        doel.style.top = y - dottedHeight / 2 + 'px';
        alignSystem ();
    }
    doel.addEventListener ('mousemove', evfa);
    doel.addEventListener ('touchmove', evfa);
    function evfb (evt) {
        doel.removeEventListener ('mousemove', evfa)
        doel.removeEventListener ('touchmove', evfa)
        doel.removeEventListener ('mouseup', evfb)
        doel.removeEventListener ('touchend', evfb)
        doel.removeEventListener ('mouseleave', evfb)
        doel.style.cursor = '';
        doel.classList.remove ('spel');
    }
    doel.addEventListener ('mouseup', evfb);
    doel.addEventListener ('touchend', evfb);
    doel.addEventListener ('mouseleave', evfb);
}

function putMarkLoc (n) {

    var p, isvg, x, y, w, h, mark, pn;
    mark = rMarks [n.vce];
    p = n.xy;
    if (!p) {   // n.xy == undefined
        mark.setAttribute ('width', 0);
        mark.setAttribute ('height', 0);
        return;
    }
    isvg = p[0]; x = p[1]; y = p[2]; w = p[3]; h = p[4];
    scrollchkHorizCnt = scrollchkHorizCnt+1;
    if (n.inv) { w = 0; h = 0; }    // markeer geen onzichtbare rusten/noten
    if (isvg != isvgPrev [n.vce] || issvgHoriz) {
        pn = mark.parentNode;
        if (pn) {
            pn.removeChild(mark);
            
        }

        pn = deSvgGs [isvg]
        pn.insertBefore (mark, pn.firstChild);
        isvgPrev [n.vce] = isvg;
        if(!issvgHoriz){ alignSystem(isvg); }
        if (n.vce==0 && pn){ 
            $("rect").eq(3).attr("id", "newId");
            //$("rect[fill-opacity='0.5']")
            var element = document.getElementById("newId");
            if(issvgHoriz){
                var randomParent = document.getElementById('notation');
                scrollParentToChild(randomParent, element);
            }else{
                element.scrollIntoView();
            }
        }
    }
    mark.setAttribute ('x', x);
    mark.setAttribute ('y', y);
    mark.setAttribute ('width', w);
    mark.setAttribute('height', h);  

}

function scrollParentToChild(parent, child) {
var  $element = $("rect#newId");
//console.log($element);
var currRectPos = parseInt($element.attr('x'))*1.4;
var currRectPos2 = parseInt($element.position().left*1.13);
if($element && scrollchkHorizCnt>30){

    scrollchkHorizCnt=0;
    if(prevHorizVal<currRectPos){
        prevHorizVal = currRectPos;
        // $('#notation').animate({
        //             scrollLeft: $element.attr('x')
        //         }, 500);
        $('#notation').scrollLeft(currRectPos);
    }
        //console.log(prevHorizVal+'###');
        //console.log($element.offset().top+' '+currRectPos+' '+$element.offset().left+' '+currRectPos2+' '+$('#notation').offset().left);
}
  // // Where is the parent on page
  // var parentRect = parent.getBoundingClientRect();
  // // What can you see?
  // var parentViewableArea = {
  //   height: parent.clientHeight,
  //   width: parent.clientWidth
  // };

  // // Where is the child
  // var childRect = child.getBoundingClientRect();
  // // Is the child viewable?
  // var isViewable = (childRect.top >= parentRect.top) && (childRect.top <= parentRect.top + parentViewableArea.height);

  // // if you can't see the child try to scroll parent
  // if (!isViewable) {
  //   // scroll by offset relative to parent
  //   parent.scrollTop = (childRect.top + parent.scrollTop) - parentRect.top

  // }


}
function mkNtsSeq () {
    var curNoteTime  = iSeq > 0 ? ntsSeq [iSeq].t : 0;
    ntsSeq = []; barTimes = {};
    var repcnt = 1, offset = 0, repstart = 0, reptime = 0, volta = 0, tvolta = 0, i, n;
    for (i = 0; i < allNotes.length; ++i) {
        n = allNotes [i];
        if (n.bt && n.v == 0) {
            if (n.t in barTimes && n.bt [0] == ':') continue;  // herhaling maar 1 keer uitvoeren (bij herhaling in herhaling)
            if (repcnt == 1 && n.bt [0] == ':' && n.t > reptime) { i = repstart - 1; repcnt = 2; offset += n.t - reptime; continue; }
            if (repcnt == 2 && n.bt [0] == ':' && n.t > reptime) { repcnt = 1; }
            if (repcnt == 1 && n.bt [n.bt.length - 1] == ':') { repstart = i; reptime = n.t; }
            if (volta && (n.tx || n.bt != '|')) { volta = 0; offset -= n.t - tvolta; }
            if (repcnt == 2 && n.tx == '1') { volta = 1; tvolta = n.t }
        };
        if (volta) continue;
        if (n.bt) { barTimes [n.t] = 1; continue; } // maattijden voor metronoom
        ntsSeq.push ({ t: n.t + offset, xy: ntsPos [n.ix], ns: n.ns, vce: n.v, inv: n.inv, tmp: n.tmp });
    }
    iSeq = 0;
    for (; iSeq < ntsSeq.length; ++iSeq) {  // zet iSeq zo richt mogelijk bij laatste cursor positie
        n = ntsSeq [iSeq];
        if (n.t >= curNoteTime && !n.inv) break;    // de eerste zichtbare noot
    }
    if (iSeq == ntsSeq.length) iSeq -= 1;
    putMarkLoc (ntsSeq [iSeq]);
}

function markeer () {
    if (!audioCtx) { alert (alrtMsg2); return }
    var t0 = audioCtx.currentTime * 1000;
    var dt = 0, t1, tf;
    var tfac = 60000 / 384;
    while (dt == 0) {
        var nt = ntsSeq [iSeq];             // de huidige noot
        if (nt.tmp != curTemp) {
            curTemp = nt.tmp;
            tmpElm.value = Math.round (curTemp * tempScale);
        }
        tf = tfac / (nt.tmp * tempScale);   // abc tijd -> echte tijd in msec
        if (iSeq == ntsSeq.length - 1) {    // laatste noot
            iSeq = -1;                      // want straks +1
            dt = nt.ns[0].dur + 1000;       // 1 sec extra voor herhaling
        } else {
            t1 = ntsSeq [iSeq + 1].t;       // abc tijd van volgende noot
            dt = (t1 - nt.t) * tf;          // delta abc tijd * tf = delta echte tijd in msec
        }
        nt.ns.forEach (function (noot, i) { // speel accoord
            if (noot.dur <= 192) tf *= 1.3  // legato effect voor <= 1/8
            else  tf *= 1.1                 // minder voor > 1/8
            speel (t0, noot.mnum, noot.dur * tf, nt.vce, noot.velo);
        });
        putMarkLoc (nt);
        iSeq += 1;
    }
    clearTimeout (timer1);
    timer1 = setTimeout (markeer, dt);

}

function keyDown (e) {
    var key = e.key;
    switch (key) {
    case 'ArrowLeft': case 'Left': iSeq -= 1; putMarkLoc (ntsSeq [iSeq]); break;
    case 'ArrowRight': case 'Right': iSeq += 1; putMarkLoc (ntsSeq [iSeq]); break;
    //case 'ArrowUp': case 'Up': setTempo (1); break;
    //case 'ArrowDown': case 'Down': setTempo (-1); break;
    //case 'm': $('#mbar').click (); break;
    case ' ':
        if (e.preventDefault) e.preventDefault ();
        playBack ();
        break;
    }
}

function playBack () {
    if(cmpDlg.style.display != 'none'){
        return;
    }
    if (!ntsSeq.length) return;
    isPlaying = 1 - isPlaying
    if (isPlaying) {
        playbtn.value = 'Stop';
        playbk.style.display = 'none';
        markeer ();
    } else {
        playbtn.value = 'Play';
        clearTimeout (timer1);
    }
}
function msg() {
    alert("here");
}
function setTempo (inc) {
    //if (inc) tmpElm.value = (tmpElm.value - 100) + inc;
    //tempScale = tmpElm.value / curTemp;
    tempScale = inc;
}

function speel (tijd, noot, dur, vce, velo) { // tijd en duur in millisecs
    if (noot == -1) return; // een rust
    var inst = noot >> 7;
    if (inst in instSf2Loaded) {
        opneer (inst, noot % 128, tijd / 1000, (dur - 1) / 1000, vce, velo);  // msec -> sec
    } else {
        var midiMsg = [0x90, noot, velo];
        zend (midiMsg, tijd, vce);
        midiMsg [2] = 0;
        zend (midiMsg, tijd + dur - 1, vce);
    }
}

function zend (midiMsg, tijd, vce) {
    if (gToSynth == 0) return;
    var mtype = midiMsg [0] & 0xf0,
        velo = midiMsg [2],
        midiNum = midiMsg [1];
    tijd /= 1000;   // millisec -> sec
    if (mtype == 0x80) op (midiNum, tijd);
    if (mtype == 0x90) {
        if (velo > 0) neer (midiNum, velo, tijd, vce);
        else op (midiNum, tijd);
    }
}

function neer (midiNum, velo, time, vce) {
    var vceVol = midiVol [vce] / 127;
    var vcePan = (midiPan [vce] - 64) / 64, panNode;
    var source = audioCtx.createBufferSource ();
    source.buffer = golven [midiNum];
    var gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime (0.00001, time);   // begin bij -100 dB
    var vol = velo * vceVol * volCorJS;
    if (vol == 0) vol = 0.00001;    // stem kan volume 0 hebben.
    gainNode.gain.exponentialRampToValueAtTime (vol, time + 0.001);
    if (hasPan) {
        panNode = audioCtx.createStereoPanner();
        panNode.pan.value = vcePan;
    }
    source.connect (panNode || gainNode);    // we doen de pan node voor de gain node!!
    if (panNode) panNode.connect (gainNode); // anders werkt de gain niet in FF
    gainNode.connect (audioCtx.destination); // verbind source met de sound kaart
    source.start (time);
    liggend [midiNum] = [source, gainNode, vol];
}

function op (midiNum, time) {
    var x = liggend [midiNum], source = x[0], g = x[1], velo = x[2];
    if (source) {
        g.gain.setValueAtTime (velo, time); // begin release at end of note
        g.gain.exponentialRampToValueAtTime (0.00001, time + 0.1); // -100 dB
        source.stop (time + 0.1);
        liggend [midiNum] = undefined;
    }
}

function opneer (instr, key, t, dur, vce, velo) {
    var g, st, g1, g2, g3, lfo, g4, g5, panNode;
    var th, td, decdur, suslev, fac, tend;
    var parm = params [instr][key];
    if (!parm) return;    // key does not exist
    var o = audioCtx.createBufferSource ();
    var wf = parm.useflt; // met filter
    var wl = parm.uselfo; // met LFO
    var we = parm.useenv; // met modulator envelope
    var vceVol = midiVol [vce] / 127;
    var vcePan = (midiPan [vce] - 64) / 64;

    o.buffer = parm.buffer
    if (parm.loopStart) {
        o.loop = true;
        o.loopStart = parm.loopStart;
        o.loopEnd = parm.loopEnd;
    }
    o.playbackRate.value = rates [instr][key];

    if (wl) {   // tremolo en/of vibrato
        lfo = audioCtx.createOscillator ();
        lfo.frequency.value = parm.lfofreq;
        g1 = audioCtx.createGain ();
        g1.gain.value = parm.lfo2vol;   // diepte tremolo
        lfo.connect (g1);               // output g1 is sinus tussen -lfo2vol en lfo2vol
        g2 = audioCtx.createGain ();
        g2.gain.value = 1.0;            // meerdere value inputs worden opgeteld
        g1.connect (g2.gain);           // g2.gain varieert tussen 1-lfo2vol en 1+lfo2vol

        g3 = audioCtx.createGain ();
        g3.gain.value = parm.lfo2ptc;   // cents, diepte vibrato
        lfo.connect (g3);
        g3.connect (o.detune);
    }

    if (wf) {
        var f = audioCtx.createBiquadFilter ();
        f.type = 'lowpass'
        f.frequency.value = parm.filter;
    }

    if (we) {
        var vol = 1.0
        g4 = audioCtx.createGain();
        g4.gain.setValueAtTime (0, t);  // mod env is lineair
        g4.gain.linearRampToValueAtTime (vol, t + parm.envatt);
        th = parm.envhld; td = parm.envdec; decdur = 0;
        if (dur > th) {                             // decay phase needed
            g4.gain.setValueAtTime (vol, t + th);   // starting at end hold phase
            if (dur < td) {                         // partial decay phase
                decdur = dur - th                   // duration of decay phase
                suslev = parm.envsus * (decdur / (td - th));  // partial gain decrease
            } else {                                // full decay phase
                decdur = td - th
                suslev = parm.envsus                // full gain decrease (until sustain level)
            }
            vol = suslev * vol;                     // gain at end of decay phase
            g4.gain.linearRampToValueAtTime (vol, t + th + decdur); // until end time of decay phase
        }
        g4.gain.setValueAtTime (vol, t + dur);      // begin release at end of note
        fac = vol;                                  // still to go relative to 100% change
        tend = t + dur + fac * parm.envrel;         // end of release phase
        g4.gain.linearRampToValueAtTime (0.0, tend); // 0 at the end

        g5 = audioCtx.createConstantSource ();
        g5.offset.value = parm.env2flt;
        g5.connect (g4);
        g4.connect (f.detune);
    }

    if (hasPan) {
        panNode = audioCtx.createStereoPanner()
        panNode.pan.value = vcePan;
    }

    vol = velo * vceVol * parm.atten * volCorSF;
    if (vol == 0) vol = 0.00001;                // -100 dB is zero volume
    g = audioCtx.createGain();
    g.gain.setValueAtTime (0.00001, t);         // -100 dB is zero volume
    g.gain.exponentialRampToValueAtTime (vol, t + parm.attack);

    th = parm.hold; td = parm.decay; decdur = 0;
    if (dur > th) {                             // decay phase needed
        g.gain.setValueAtTime (vol, t + th);    // starting at end hold phase
        if (dur < td) {                         // partial decay phase
            decdur = dur - th                   // duration of decay phase
            suslev = Math.pow (10, Math.log10 (parm.sustain) * (decdur / (td - th)));  // partial gain decrease (linear ratio in dB)
        } else {                                // full decay phase
            decdur = td - th
            suslev = parm.sustain               // full gain decrease (until sustain level)
        }
        vol = suslev * vol;                     // gain at end of decay phase
        g.gain.exponentialRampToValueAtTime (vol, t + th + decdur); // until end time of decay phase
    }
    g.gain.setValueAtTime (vol, t + dur);       // begin release at end of note

    fac = (100 + 20 * Math.log10 (vol)) / 100;  // still to go relative to 100dB change
    tend = t + dur + fac * parm.release;        // end of release phase
    g.gain.exponentialRampToValueAtTime (0.00001, tend); // -100 dB

    if (wf) {   o.connect (f); f.connect (panNode || g); }
    else        o.connect (panNode || g);       // we doen de pan node voor de gain node!!
    if (panNode) panNode.connect (g);           // anders werkt de gain niet in FF
    if (wl) {   g.connect (g2); g2.connect (audioCtx.destination); }
    else        g.connect (audioCtx.destination);

    o.start (t);
    if (wl) lfo.start (t + parm.lfodel);
    if (we) g5.start (t);
    o.stop (tend);
    if (wl) lfo.stop (tend);
    if (we) g5.stop (tend);
}

function decode (xs) {
    return new Promise (function (resolve, reject) {
        var bstr = atob (xs);           // decode base64 to binary string
        var ab = new ArrayBuffer (bstr.length);
        var bs = new Uint8Array (ab);   // write as bytes
        for (var i = 0; i < bstr.length; i++)
            bs [i] = bstr.charCodeAt (i);
        audioCtx.decodeAudioData (ab, function (buffer) {
            resolve (buffer);           // buffer = AudioBuffer
        }, function (error) {
            reject ({err: 1, msg: error, data:''});
        });
    });
}

function inst_create (instr) {
    return new Promise (function (resolve, reject) {
        rates [instr] = [];
        params[instr] = [];
        function sampleIter (i) {
            var gen, parm, sample, scale, tune, cd;
            gen = instData [i];
            parm = {
                attack:  gen.attack,
                hold:    gen.hold,
                decay:   gen.decay,
                sustain: gen.sustain,
                release: gen.release,
                atten:   gen.atten,
                filter:  gen.filter,
                lfodel:  gen.lfodel,
                lfofreq: gen.lfofreq,
                lfo2ptc: gen.lfo2ptc,
                lfo2vol: gen.lfo2vol,
                envatt:  gen.envatt,
                envhld:  gen.envhld,
                envdec:  gen.envdec,
                envsus:  gen.envsus,
                envrel:  gen.envrel,
                env2flt: gen.env2flt,
                uselfo: hasLFO && gen.lfofreq > 0.008 && (gen.lfo2ptc != 0 || gen.lfo2vol != 0), // LFO needed (vibrato or tremolo)
                useflt: hasFlt && gen.filter < 16000,                       // lowpass filter needed
                useenv: hasVCF && gen.filter < 16000 && gen.env2flt != 0,   // modulator envelope needed
            }
            if (gen.loopStart) {
                parm.loopStart = gen.loopStart;
                parm.loopEnd   = gen.loopEnd;
            }
            scale = gen.scale;
            tune =  gen.tune;
            for (var j = gen.keyRangeLo; j <= gen.keyRangeHi; j++) {
                rates [instr][j] = Math.pow (Math.pow (2, 1 / 12), (j + tune) * scale);
                params[instr][j] = parm;
                midiLoaded [instr * 128 + j] = 1;   // onthoud dat de noot geladen is
            }
            decode (gen.sample).then (function (audBuf) { // b64 encoded binary string -> AudioBuffer
                parm.buffer = audBuf;
                if (i < instData.length - 1) sampleIter (i + 1);
                else { instData = ''; resolve ('ok'); }   // save memory
            }).catch (function (error) {
                reject (error);
            });
        }
        sampleIter (1);
    });
}

function laadJSfont (inst) {
    return new Promise (function (resolve, reject) {
        var elm = document.createElement ('script');
        elm.src = instUrl + 'instr' + inst + 'mp3.js';    // instData = "..."
        elm.onload = function () {
            resolve ('ok');
            document.head.removeChild (elm);
        };
        elm.onerror = function (err) {
            reject ({err: 2, msg: 'could not load ' + elm.src, data: inst});
        };
        document.head.appendChild (elm);
    });
}

function showFout (fout) {
    if (fout.err == undefined) { fout.err = 4; fout.msg = fout.toString (); }
    logerr (fout.err + ', ' + fout.msg + ', ' + fout.data);
    //~ cmpDlg.innerHTML += ', instr failed: ' + inst;
    switch (fout.err) {
    case 1: alert ('Your browser does not support decoding ogg/vorbis -> no playback'); break;
    case 2: var txt = 'Loading javascript soundfont failed, instrument '+ fout.data + '\nfalling back to midi-js';
            txt = 'Loaing Midi Data...';
        logerr (txt);
        cmpDlg.innerHTML +=  txt.replace ('\n', '<br>'); break;
    case 3: logerr ('Loading midi-js soundfont failed, instrument '+ fout.data + '\nmsg: ' + fout.msg); break;
    case 4: alert (fout.msg); break;
    }
}

function laadNoot (midiNums) {
    function laadInst (nprg) {
        return new Promise (function (resolve, reject) {
            if (instArr [nprg]) { resolve ('ok'); return; }
            var url, pf = 'https://rawgit.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/';
            if (noMidiJs [nprg]) url = pf + instNm + '-mp3';
            else {
                instNm = nprg in instTab ? instTab [nprg] : instNm;
                url = instUrl + instNm + '-mp3';
            }
            //cmpDlg.innerHTML += ', loading: ' + nprg;
            var elm = document.createElement ('script');
            elm.src = url + '.js';
            elm.onload = function () {
                instArr [nprg] = MIDI.Soundfont [instNm];
                urlLoaded [url] = 1;
                logerr ('midi-js instr ' + inst + ' geladen');
                resolve ('ok');
            };
            elm.onerror = function () {
                reject ({err: 3, msg: 'could not load:' + url, data: nprg});
            };
            if (url in urlLoaded) { resolve ('ok'); return };     // voorkom dubbele scripts
            document.head.appendChild (elm);
        });
    }
    function laadMidiJsFont (nprg) {
        laadInst (nprg).then (function () {
            var xs = instArr [nprg] [noot + oct].split (',')[1];
            return decode (xs);
        }).then (function (buffer) {
            golven [insmid] = buffer;
            cmpDlg.innerHTML += ', ' + nprg + ':' + ixm;
            midiLoaded [insmid] = 1; // onthoud dat de noot geladen is
            laadNoot (midiNums);     // laad de volgende noot
        }).catch (function (error) {
            showFout (error);
            if (error.msg.indexOf ('gleitz') == -1) {
                noMidiJs [nprg] = 1;
                //cmpDlg.innerHTML += '<br>loading local midi-js font failed, instrument: ' + error.data + '<br>trying Github ...'
                laadMidiJsFont (nprg);  // probeer opnieuw met github
            } else {
                alert ('loading soundfont from Github failed, giving up.');
                cmpDlg.style.display = 'none';
            }
        });
    }
    var notes = 'C Db D Eb E F Gb G Ab A Bb B'.split (' ');
    var insmid = midiNums.shift (); // midiNums wordt opgegeten
    if (!insmid) {                  // alle noten zijn geladen
        gToSynth = 1;
        cmpDlg.style.display = 'none';
        return;
    }
    var inst = insmid >> 7;
    var ixm  = insmid % 128;
    var noot = notes [ixm % 12]
    var oct = Math.floor (ixm / 12) - 1;
    var instNm = inst_tb [inst];    // standard GM name
    if (instSf2Loaded [inst]) { laadNoot (midiNums); return; }  // laad de volgende noot
    if (withRT && !noSf2 [inst]) {  // probeer voorgekookte sf2 file
        laadJSfont (inst).then (function () {
            cmpDlg.innerHTML += 'loading instrument ' + inst + '<br>';
            return inst_create (inst);
        }).then (function () {
            logerr ('instr ' + inst + ' geladen');
            instSf2Loaded [inst] = 1;
            laadNoot (midiNums);    // laad de volgende noot
        }).catch (function (error) {
            showFout (error);
            noSf2 [inst] = 1;
            laadMidiJsFont (inst);
        });
    } else {
        laadMidiJsFont (inst);
    }
}

function laadNootHulp (midiUsed) {
    var midiNums = Object.keys (midiUsed).filter (function (m) { return !(m in midiLoaded); });
    if (midiNums.length) {
        cmpDlg.innerHTML = '';
        cmpDlg.style.display = 'block';
        laadNoot (midiNums);
    }
}

function parsePreload () {
    var parstr, xmlfnm = '', preload = '', ps, noMenu, noSave, noErr, noDash, i, xs, prm, p = {}, r;
    errElm.innerHTML = '';
    parstr = window.location.href.replace ('?dl=0','').split ('?'); // look for parameters in the url;
    if (parstr.length > 1) {
        ps = parstr [1].split ('&');
        for (i = 0; i < ps.length; i++) {
            p = ps [i].replace (/d:(\w{15}\/[^.]+\.)/, 'https://dl.dropboxusercontent.com/s/$1');
            if (p == 'noErr') noErr = 1;
            else if (p == 'noMenu') noMenu = 1;
            else if (p == 'noSave') noSave = 1;
            else if (p == 'noErr') noErr = 1;
            else if (p == 'noDash') noDash = 1;
            else if (p == 'noRT') withRT = 0;   // no realtime sf2, use pre-rendered MIDIjs
            else if (p == 'noPF') noPF = 1;     // do not translate xml page format
            else if (p == 'noLB') noLB = 1;     // do not translate xml line breaks
            else if (r = p.match (/noCur=([\da-fA-F]{2})/)) gCurMask = parseInt (r [1], 16);
            else if (p == 'nosm') hasSmooth = false;
            else preload = p;
        }
    };
    prm = document.getElementById ('parms');
    p = prm ? JSON.parse (prm.innerHTML) : {} ;
    if (p.topSpace != undefined) topSpace = p.topSpace;
    if (p.notationHeight != undefined) notationHeight = p.notationHeight;
    if (p.fileURL != undefined) preload = p.fileURL;
    if (p.gTempo != undefined) gTempo = p.gTempo;
    if (p.noCur != undefined) gCurMask = p.noCur;
    if (p.noDash != undefined && p.noDash || noDash) rolElm.style.visibility = 'hidden';
    if (p.noSave != undefined && p.noSave || noSave) document.getElementById ('savlbl').style.display = 'none';
    if (p.noMenu != undefined && p.noMenu || noMenu) document.getElementById ('mbar').style.display = 'none';
    if (p.noErr != undefined && p.noErr   || noErr)  {
        errElm.style.display = 'none';
        errElm.style.height = '0px';
    };

    if (/(\.xml$)|(\.abc$)/.test (preload)) { xmlfnm = preload; preload = ''; }
    if (xmlfnm) {           // force loading xml as plain text
        var waitElm = document.getElementById ('wait');
        waitElm.style.display = 'block';
        var request = new XMLHttpRequest ();
        request.open ('GET', xmlfnm, true);
        request.onload = function () {
            logerr ('preload ok');
            readAbcOrXML (request.response);
            playbk.style.display = 'block';
            waitElm.style.display = 'none';
        }
        request.onerror = function () {
            waitElm.innerHTML += '\npreload failed';
        }
        request.send();
    }
}

function resizeNotation () {
    var bh = document.documentElement.clientHeight;
    var eh = errElm.clientHeight;
    eh = Math.round (100 * eh / bh);
    abcElm.style.height = (notationHeight - eh) + '%';
}

function saveLayout () {
    var abc2svg, muziek = '', errtxt = '';

    function errmsg (txt, line, col) {
        errtxt += txt + '\n';
    }

    function img_out (str) {
        muziek += str;
    }

    if (!gAbcSave) return;
    var user = {
        'imagesize': 'width="100%"',
        'img_out': img_out,
        'errmsg': errmsg,
        'read_file': null,
        'anno_start': null,
        'get_abcmodel': null
    }
    abc2svg = new Abc (user);
    abc2svg.tosvg ('abc2svg', gAbcSave);
    if (errtxt == '') errtxt = 'no error\n';
    logerr (errtxt);
	if (!muziek) return;

    var a, fnm, of;
    var res = '<html><meta charset="utf-8"><div>\n' + muziek + '\n</div></html>\n';
    fnm = scoreFnm + '.html';
    try {
        a = document.createElement ('a');   // don't bother to use jquery
        a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent (res);
        a.download = fnm;
        a.text = "Save ABC file"
        document.getElementById ('saveDiv').appendChild (a); // append to a dummy invisible div
        a.click (); // only seems to work if a is appended somewhere in the body
    } catch (err) {
        if (!confirm ('Do you want to save the ABC text?')) return;
        document.open ("text/html");    // clears the whole document and opens a new one
        document.write ('<pre>' + res + '</pre>');
        document.close ();
    }
}

function addUnlockListener (elm, type, handler) {
    function unlockAudio (evt){
        elm.removeEventListener ('mousedown', unlockAudio);
        elm.removeEventListener ('touchend', unlockAudio);
        console.log ('event listeners removed from ' + elm.nodeName + '#' + elm.id);
        if (audioCtx && audioCtx.state == 'suspended') {
            audioCtx.resume ().then (function () {
                console.log ('resuming audioContext');
            });
        }
    }
    elm.addEventListener ('mousedown', unlockAudio);
    elm.addEventListener ('touchend', unlockAudio);
    elm.addEventListener (type, handler);
}

function dropuse () {
    function grey (b) { drpuse.checked = !b; drpuse.disabled = b; drplbl.style.color = b ? '#aaa' : '#000';}
    if (typeof (Dropbox) == 'undefined') {
        grey (true);
        var elm = document.createElement ('script');
        elm.src = 'https://www.dropbox.com/static/api/2/dropins.js';
        elm.onload = function () {
            grey (false);
            Dropbox.init ({appKey: 'ckknarypgq10318'});
            var dknp = Dropbox.createChooseButton ({
                success: readDbxFile,
                cancel: function() {}, linkType: "direct", multiselect: false,
                extensions: ['.xml', '.abc']
            });
            abcfile.append (dknp);
            dropuse ();
        };
        elm.onerror = function () { logerr ('loading dropbox API failed'); };
        document.head.appendChild (elm);
    } else {
        document.querySelector ('.dropbox-dropin-btn').style.display = drpuse.checked ? 'inline-block' : 'none';
        fknElm.style.display = drpuse.checked ? 'none' : 'inline-block';
    }
}

function setFullscreen () {
    var e = document.body;
    var fscrAan = e.requestFullscreen || e.mozRequestFullScreen || e.webkitRequestFullscreen;
    var fscrUit = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;
    if (!fscrAan || !fscrUit) return;
    if ($('#fscr').prop ('checked')) fscrAan.call (e);
    else fscrUit.call (document);
}
function stopPlaying() {
    audioCtx.stop();
}
var stopButton;
document.addEventListener ('DOMContentLoaded', function () {
    cmpDlg = document.getElementById ('comp');
    abcElm = document.getElementById ('notation');
    errElm = document.getElementById ('err');
    rolElm = document.getElementById ('rollijn');
    abcfile = document.getElementById ('abcfile');
    fknElm = document.getElementById ('fknp');
    tmpElm = document.getElementById ('tempo');
    playbk = document.getElementById ('playbk');
    playbtn = document.getElementById ('play');
    stopbtn = document.getElementById('stop');
    stopButton = stopButton;
    playbackSpeed = document.getElementById('playbackSpeed')
    document.getElementById ('kwart').appendChild (document.getElementById ('mtrsvg'));
    addUnlockListener (playbtn, 'click', playBack);
    addUnlockListener (playbk, 'click', playBack);
    fknElm.addEventListener ('change', readLocalFile);
    document.getElementById ('save').addEventListener ('click', saveLayout);
    rolElm.addEventListener ('mousedown', lijn_shift);
    rolElm.addEventListener ('touchstart', lijn_shift);
    //tmpElm.addEventListener ('change', setTempo);
    window.addEventListener ('resize', function () {
        setScale ();
        resizeNotation ();
        alignSystem ();
    });
    // drag drop
    abcElm.addEventListener ('drop', doDrop);
    //playbackSpeed.addEventListener('slideStop', )
    abcElm.addEventListener ('dragover', function (e) {   // this handler makes the element accept drops and generate drop-events
        e.stopPropagation ();
        e.preventDefault ();                        // the preventDefault is obligatory for drag/drop!
        e.dataTransfer.dropEffect = 'copy';         // Explicitly show this is a copy.
    });
    abcElm.addEventListener ('dragenter', function () { this.classList.add ('indrag'); });
    abcElm.addEventListener ('dragleave', function () { this.classList.remove ('indrag'); });
    // dropbox
    drpuse = document.getElementById ('drpuse');
    drpuse.checked = false;
    drpuse.addEventListener ('click', dropuse);
    drplbl = document.getElementById ('drplbl');
    // menu
    mbar = document.getElementById ('mbar');
    menu = document.getElementById ('menu');
    menu.style.display = 'none';
    mbar.addEventListener ('click', function (ev) {
        ev.stopPropagation ();
        var hidden = menu.style.display == 'none';
        menu.style.display = hidden ? 'block' : 'none';
        mbar.style.background = hidden ? '#aaa' : '';
    });
    menu.addEventListener ('click', function (ev) {
        ev.stopPropagation ();  // anders krijgt notation/body/svg ook de click
    });
    hasSmooth = CSS.supports ('scroll-behavior', 'smooth');
    parsePreload ();
    resizeNotation ();
    var ac = window.AudioContext || window.webkitAudioContext;
    audioCtx = ac != undefined ? new ac () : null;
    if (!audioCtx) { alert (alrtMsg2);
    } else {
        if (!audioCtx.createStereoPanner) hasPan = 0;
        if (!audioCtx.createOscillator) hasLFO = 0;
        if (!audioCtx.createBiquadFilter) hasFlt = 0;
        if (!audioCtx.createConstantSource) hasVCF = 0;
        //~ audioCtx.suspend ();   // test suspension
        //~ hasLFO = 0; hasFlt = 0; hasVCF = 0; hasPan = 0;
        var m = [], m2 = 0, s = 'Your browser does not support ';
        if (!hasPan) m.push (s + 'the StereoPanner element');
        if (withRT && !hasLFO) { m.push (s + 'the Oscillator element'); m2 = 1; }
        if (withRT && !hasFlt) { m.push (s + 'the BiquadFilter element'); m2 = 1; }
        if (withRT && !hasVCF) { m.push (s + 'the ConstantSource element'); m2 = 1; }
        if (m.length) alert (m.join ('\n') + (m2 ? '\nThe instrument(s) will sound (very) wrong' : ''));
    }
    if (!hasSmooth) alert ('Your browser does not support smooth scrolling');
    document.getElementById ('verlab').innerHTML = '<span>Version:</span>' + xmlplay_VERSION;
    $('#fscr').on ('change', setFullscreen);
    $('body').on ('fullscreenchange webkitfullscreenchange mozfullscreenchange', function () {
        var e = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
        $('#fscr').prop ('checked', e != null);
    });
    document.body.addEventListener ('keydown', keyDown);

});

