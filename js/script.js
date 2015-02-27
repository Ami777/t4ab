var timeForABreakApp = angular.module('timeForABreakApp', ['ngCookies']);

timeForABreakApp.controller('timeForABreakCtrl', function ($scope, $interval, $cookies) {
    $scope.excersise1st = 'While taking a deep breath look at the tip of your nose. When breathing out change the focus to the most distant point you can. Repeat 10 times.';
    $scope.excersiseLast = 'Go talk with someone. Now your eyes are OK, your body is OK, so don`t let your social-skills be affected by computer work. Go and talk with someone real face-to-face for the reaming time.';
    $scope.excersises = [
        'While sitting on your chair - take a deep breath and move your shoulders close to your ears. Hold in this position for 3 to 5 seconds. Breathe out while moving your shoulders back to the normal position. Repeat three times',
        'Head circulating. Bend your neck to move the head close to one shoulder and then the other (five times to each shoulder). Next start moving your head slowly in circles – five times left and five times right. This will help you relax your shoulder muscles and improve blood flow to your brain.',
        'While leaned back against your chair straighten your arms in front of you. Interlock all your fingers and reach out as far as you can (your palms facing you). Hold in this position for approx. 15 seconds. (For better effect you can repeat the excercise).',
        'While sitting on your chair turn right trying to reach and grab the left side of the backrest – hold for 3-5 seconds. Repeat the exercise in the opposite direction.',
        'Reach out as much as you can with fingers spread so much you can feel them stretch. Hold in this position for couple of seconds and then clench your fists. Repeat 3 times.',
        'While standing up bend forward couple of times and deepen a little after each bend.',
        'Straighten your fingers to the maximum and splay the a little. With quite a quick move fold them from the pinkie so that your thumb reach the index finger.',
        'While standing up reach up as high as you can (the fingers can be interlocked). In that position lean left and right couple of times (5 times each side).',
        'Squat. Spread your legs standing up and straighten your arms in front of you. Start crouching down watching your heels not to break off the ground. Keep your knees within the line of your feet. Crounch until your thighs create a right angle with the floor.'
    ];
    $scope.excersiseIdx = $scope.excersises.length; //Let it overflow at the beginning so it will shuffle
    $scope.excersisesSelected = [];
    $scope.excersiseVisible = 0;

    $scope.TIME_WORK = 50; //50 //Time in minutes for work
    $scope.TIME_BREAK = 10; //10 //Time in minutes for break
    $scope.TIME_TICK_EACH = 10; //10 //Time in minutes for tick
    $scope.timerCircleColors = { //Colors of timer circle
        'work':[
            '#93D6B0',
            '#27ae60'
        ],
        'nap':[
            '#F0B27A',
            '#e67e22'
        ],
        'break':[
            '#F4A9A1',
            '#e74c3c'
        ]
    };
    $scope.lastMins;
    $scope.nextBreak; //This will hold Date of next break time
    $scope.timerCircle; //This will hold Circles instance

    $scope.options = [
        {
            'typ':'bool',
            'id':'noticeEach10Mins',
            'text':'Notify me each 10 minutes',
            'val':true
        },
        {
            'typ':'bool',
            'id':'useSounds',
            'text':'Use sounds',
            'val':true
        },
        {
            'typ':'sel',
            'id':'numberOfExercises',
            'text':'Number of exercises in break time',
            'vals':[0,3,5,7],
            'val':5
        },
        {
            'typ':'bool',
            'id':'forceTabActivate',
            'text':'Force window activation after 1m',
            'val':true
        }
    ];

    $scope.timeLeft_minutes=$scope.TIME_WORK;
    $scope.timeLeft_seconds=0;
    $scope.timeLeft_to_break_or_work='work';
    $scope.currMode = 'work'; //Modes: 'work', 'pause', 'nap', 'break'
    $scope.visibleNote = '';

    $scope.shuffle = function(array) {
        //<http://bost.ocks.org/mike/shuffle/>
        var m = array.length, t, i;

        // While there remain elements to shuffle…
        while (m) {

            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }

        return array;
    }

    $scope.stopAlarm = function(){
        soundManager.stop('alarm');
    }

    $scope.isExerciseVisible = function(idx){
        return idx==$scope.excersiseVisible;
    }

    $scope.setVisibleExercise = function(move){
        $scope.excersiseVisible=$scope.excersiseVisible+move;
    }

    $scope.isExerciseButtonVisible = function(move){
        return ($scope.excersiseVisible+move>=0)&&($scope.excersiseVisible+move<$scope.getOpt('numberOfExercises'));
    }

    $scope.isExerciseCloseBtnVisible = function(){
        return ($scope.excersiseVisible==$scope.getOpt('numberOfExercises')-1);
    }

    $scope.getNextExercise = function(){
        $scope.excersiseIdx++;
        if ($scope.excersiseIdx>=$scope.excersises.length){
            $scope.excersises=$scope.shuffle($scope.excersises);
            $scope.excersiseIdx=0;
        }
        return $scope.excersises[$scope.excersiseIdx];
    }


    $scope.showExercises = function(){
        $scope.nextModeAct('break');

        if ($scope.getOpt('numberOfExercises')==0)
            return $scope.closeNote('break');

        $scope.excersisesSelected = [$scope.excersise1st];
        for(var i=1; i<=$scope.getOpt('numberOfExercises')-2; i++)
            $scope.excersisesSelected.push($scope.getNextExercise());
        $scope.excersisesSelected.push($scope.excersiseLast);

        $scope.excersiseVisible = 0;

        $scope.showNote('exercises', 'break');
    }

    $scope.showNote = function(noteId, currMode){
        currMode = currMode || 'pause';
        $scope.visibleNote = noteId;
        $scope.currMode = currMode;
    }

    $scope.nextModeAct = function(modeToGoTo){
        $scope.closeNote(modeToGoTo);

        $scope.CountNextBreak();

        $scope.RebuildCircle();
    }

    $scope.closeNote = function(modeToGoTo){
        $scope.visibleNote = '';
        $scope.currMode = modeToGoTo;
    }

    $scope.isNoteVisible = function(noteId){
        return noteId==$scope.visibleNote;
    }

    $scope.getOpt = function(id){
        var _el = undefined;
        $.each($scope.options, function(){
            if (this.id==id)
                _el = this.val;
        });
        return _el;
    }

    $scope.saveOpts = function(){
        $.each($scope.options, function(){
            $cookies['opt_'+this.id] = this.val;
        });
    }

    $scope.loadOpts = function(){
        $.each($scope.options, function(idx){
            var _val = $cookies['opt_'+this.id];
            if (typeof _val == 'undefined')
                _val = this.val;
            else {
                switch (this.typ){
                    case 'bool':
                        _val = _val=='true';
                        break;
                    case 'sel':
                        _val = parseInt(_val);
                        break;
                }
                $scope.options[idx].val = _val;
            }
        });
    }

    /**
     * This will count next break time
     */
    $scope.CountNextBreak = function(){
        $scope.nextBreak = (new Date());
        $scope.nextBreak.setMinutes($scope.nextBreak.getMinutes() + $scope.getTimeMax());

        $scope.lastMins = $scope.getTimeMax()-1;
    }

    /**
     *  This will count time left to next break in minutes and seconds.
     * @returns {'minutes':int minutes_left, 'seconds':int seconds_left}
     */
    $scope.CountTimeLeft = function(){
        //By Andrew D.
        //Original code from http://stackoverflow.com/a/7763788/675323

        var d1=new Date(); //now
        var d2=$scope.nextBreak; // now

        var diff=d2-d1,sign=/*diff<0?-1:*/1,milliseconds,seconds,minutes,hours,days;
        diff/=sign; // or diff=Math.abs(diff);
        diff=(diff-(milliseconds=diff%1000))/1000;
        diff=(diff-(seconds=diff%60))/60;
        diff=(diff-(minutes=diff%60))/60;

        return {'minutes':minutes, 'seconds':seconds};
    }

    $scope.getTimeMax = function(){
        switch($scope.currMode){
            case 'work':
                return $scope.TIME_WORK;
            case 'nap':
                return 5;
            case 'break':
                return $scope.TIME_BREAK;
        }
    }

    $scope.RebuildCircle = function(){
        if (!$('#timerDiv').is(':visible')){ //We need this as Angular won`t finish showing up before call to this after new mode is selected
            $interval($scope.RebuildCircle, 100, 1);
            return;
        }
        var _radius = $('#timerDiv').height()<$('#timerDiv').width()?$('#timerDiv').height()/2:$('#timerDiv').width()/ 2,
            _width = _radius>200?50:25,
            _timeLeft = $scope.CountTimeLeft();

        $scope.timerCircle = Circles.create({
            id:           'timerDiv',
            radius:       _radius,
            value:        $scope.getTimeMax()-_timeLeft.minutes-1,
            maxValue:     $scope.getTimeMax(),
            width:        _width,
            text:         '',
            colors:       $scope.timerCircleColors[$scope.currMode],
            duration:       400
        });
        $('#timerDiv').find('.circles-text').css('line-height', Math.round(parseInt($('#timerDiv').find('.circles-text').css('line-height')) / 5)+'px');
        ;
        var
            _dcOffset = $('#timerDiv').find('.circles-wrp').offset(),
            _dcWidth = $('#timerDiv').find('.circles-wrp').width(),
            _dcHeight = $('#timerDiv').find('.circles-wrp').height();

        $('#timerTextDiv').css({
            'position':'absolute',
            'left':_dcOffset.left,
            'top':_dcOffset.top,
            'width':(_dcWidth)+'px',
            'height':(_dcHeight-Math.round(_dcHeight/4))+'px',
            'margin-top':Math.round(_dcHeight/4)+'px'
        });
    }

    $scope.ActivateWindow = function(message){
        //<http://stackoverflow.com/questions/28517901/how-activate-a-browser-tab-which-is-inactive>
        //<http://stackoverflow.com/questions/2704206/how-to-change-browser-focus-from-one-tab-to-another>
        //<http://stackoverflow.com/questions/8135188/focus-tab-or-window>
        //<http://stackoverflow.com/questions/3423470/how-to-focus-window-tab-like-alert>
        if (!$scope.getOpt('forceTabActivate'))
            return;

        $interval(function(){
            if (this.mode == $scope.currMode)
                window.alert(this.msg);
        }.bind({'msg':message, 'mode':$scope.currMode}), 60000, 1);
    }

    $scope.RefreshTimer = function(){
        if ($scope.currMode == 'pause') return;

        var _timeLeft = $scope.CountTimeLeft(),
            _break_or_work = $scope.currMode=='break'?'break':'work';

        if (_timeLeft.minutes+_timeLeft.seconds<0){
            switch($scope.currMode){
                case 'nap':
                case 'work':
                    soundManager.play('alarm', {loops:9});
                    $scope.showNote('break-time');
                    $.titleAlert('It`s time for break!', {
                        duration:0,
                        stopOnMouseMove:true
                    });
                    $scope.ActivateWindow('It`s time for break!');
                    return;
                case 'break':
                    soundManager.play('alarm', {loops:9});
                    $scope.showNote('work-time');
                    $.titleAlert('It`s time for work!', {
                        duration:0,
                        stopOnMouseMove:true
                    });
                    $scope.ActivateWindow('It`s time for work!');
                    return;
            }
        }

        if ($scope.lastMins!=_timeLeft.minutes){
            $scope.lastMins = _timeLeft.minutes;
            $scope.timerCircle.update($scope.getTimeMax()-_timeLeft.minutes-1, 1000);

            if ((_timeLeft.minutes-1) % $scope.TIME_TICK_EACH == 0){ //Run each 10 minutes
                $.titleAlert((_timeLeft.minutes+1)+'m of '+_break_or_work+' left', {
                    duration:5000
                });
                soundManager.play('tick');
            }
        }

        $scope.timeLeft_minutes=_timeLeft.minutes;
        $scope.timeLeft_seconds=_timeLeft.seconds;
        $scope.timeLeft_to_break_or_work=_break_or_work;
    }

    $scope.showFirstTimer = function(){
        if (typeof $cookies.tfab_visited == 'undefined'){
            $cookies.tfab_visited = true;
            $scope.showNote('first-time');
        }
    }

    $scope.showFirstTimer();
    $scope.loadOpts();
    if ($scope.getOpt('useSounds')){
        soundManager.unmute();
    } else {
        soundManager.mute();
    }
    $scope.CountNextBreak();
    $scope.RebuildCircle();
    $scope.RefreshTimer();
    $interval($scope.RefreshTimer, 1000);
    $(window).on('resize', $scope.RebuildCircle);
});

timeForABreakApp.directive('optElChange', function() {
    return function($scope, element) {
        element.bind('change', function() {
            if ($scope.getOpt('useSounds')){
                soundManager.unmute();
            } else {
                soundManager.mute();
            }
            $scope.saveOpts();
        });
    };
});

$(function(){
    soundManager.setup({
        url: 'swf/soundmanager2.swf',
        flashVersion: 9,
        onready: function() {
            //Load sounds:
            soundManager.createSound({
                id: 'tick',
                url: 'snd/tick.mp3'
            });
            soundManager.createSound({
                id: 'alarm',
                url: 'snd/alarm.mp3'
            });
        }
    });
});
