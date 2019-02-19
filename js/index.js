var defaultSettings = {
    // Filters.
    year: "allen Jahren seit '13",
    lang: 'jeder',
    urbanity: 'Österreich gesamt',
    schooltype: "Schule mit Matura-Abschluss",
    pointwidth: 18,
    pointspersecond: 100,
    minspeed: 1,
    maxspeed: 3,
    lockfilters: false,
    flipstats: false
};
var urlParams = {};
var settings = {};
var rawFilteredData = [];
var allReglData = [];
var visiblePoints = [];
var regl = null;
var MAX_HEIGHT;
var previousTime = 0;
var previousIndexAllReglData = 0;
var drawPoints;
var totalNmsStudents = 0;
var totalNmsPassed = 0;
var totalNmsNotPassed = 0;

var totalHsStudents = 0;
var totalHsPassed = 0;
var totalHsNotPassed = 0;
var resultCubes = 50;

var scaleUpperCubeResultBar = 100 / resultCubes;
var opacityScaleCube = linearScale([0, scaleUpperCubeResultBar], [0, 1]);
          // .domain([0, scaleUpperCubeResultBar])
          // .range([0, 1]);

var $nmsPassedCube;
var $nmsNotPassedCube;
var $hsPassedCube;
var $hsNotPassedCube;


$(document).ready(function() {
    // at initialization:
    window.pymChild = new pym.Child();

    // Get all the url parameters as a nice json.
    urlParams = getJsonFromUrl();

    // Merge defaults and passed settings through url into one settings object.
    settings = $.extend({}, defaultSettings, urlParams);

    console.log(settings);

    if (settings['flipstats'] === true) {
        $percentages = $('.statistics .percentage');
        $counts = $('.statistics .count');

        $percentages.html(0).removeClass('percentage').addClass('count');
        $counts.html(0 + '%').removeClass('count').addClass('percentage');
    }

    // Apply the selected settings to the view.
    applySelectedSettingsToFilterView(settings);

    // Check if we want to show filters to the user.
    if (settings['lockfilters'] === false) {
        // Make filters usable.
        bindClickEventsFilters(settings, startVisualisation);
    } else {
        $('#filters').addClass('locked');
    }

    drawResultBarChart(resultCubes);

    $('#play-btn, #replay-btn').on('click touchstart', function() {
        $(this).addClass('activated');
        $('#replay-btn').addClass('show');
        startVisualisation();
    });

    // on resize/render:
    window.pymChild.sendHeight();

    $('window').on('resize', window.pymChild.sendHeight);

    if (settings['autostart'] === true) {
        startVisualisation();
        $('#replay-btn').addClass('show');
    } else {
        $('#play-btn').show();
    }
});

function startVisualisation() {
    if (regl !== null) {
        regl.destroy();
        regl = null;
    }

    totalNNmsStudents = 0;
    totalNmsPassed = 0;
    totalNmsNotPassed = 0;
    totalHsStudents = 0;
    totalHsPassed = 0;
    totalHsNotPassed = 0;

    currentNmsPassedCubeIndex = 0;
    currentHsPassedCubeIndex = 0;

    currentNmsNotPassedCubeIndex = 49;
    currentHsNotPassedCubeIndex = 49;

    useTopNms = true;
    useTopHs = true;

    useTopNmsNotPassed = false;
    useTopHsNotPassed = false;

    // Reset all numbers.
    $('.student-count').html(0).data('count', 0);
    $('.nms-stats .passed .count').html(0);
    $('.nms-stats .not-passed .count').html(0);
    $('.nms-stats .passed .percentage').html('0%');
    $('.nms-stats .not-passed .percentage').html('0%');

    $('.nms-stats .passed .percentage').data('percentage', 0);
    $('.nms-stats .not-passed .percentage').data('percentage', 0);

    $('.hs-stats .passed .count').html(0);
    $('.hs-stats .not-passed .count').html(0);
    $('.hs-stats .passed .percentage').html('0%');
    $('.hs-stats .not-passed .percentage').html('0%');

    $('.hs-stats .passed .percentage').data('percentage', 0);
    $('.hs-stats .not-passed .percentage').data('percentage', 0);

    drawResultBarChart(resultCubes);

    $nmsPassedCube = $('#nms-bar').find('.cube:first');
    $nmsNotPassedCube = $('#nms-bar').find('.cube:last');

    $hsPassedCube = $('#hs-bar').find('.cube:first');
    $hsNotPassedCube = $('#hs-bar').find('.cube:last');

    // Filter the data that we need.
    rawFilteredData = getFilteredData(settings['lang'], settings['schooltype'], settings['urbanity'], settings['year']);

    allReglData = shuffle(createReglDataPoints(rawFilteredData, settings['minspeed'], settings['maxspeed']));
    visiblePoints = [];
    previousTime = 0;
    previousIndexAllReglData = 0;

    // Create REGL instance.
    regl = createREGL({
        onDone,
        container: $('#graph')[0]
    });

    // Must come after regl is instantiated.
    MAX_HEIGHT = parseInt($('#graph').find('canvas').attr('height'), 10);
}

function getNextDataBatch(previousTime, time) {
    if (previousIndexAllReglData >= allReglData.length) return [];

    // This is in milliseconds going up to 1.
    let timeDiff = time - previousTime;

    let amountOfPointsToAdd = Math.floor(settings['pointspersecond'] * timeDiff);

    let slice = allReglData.slice(previousIndexAllReglData, previousIndexAllReglData + amountOfPointsToAdd);

    previousIndexAllReglData += amountOfPointsToAdd;

    return slice;
}

function onDone(err, regl) {
    if (err) return console.log(err)
    window.regl = regl;

    drawPoints = regl({
        vert: `
            precision mediump float;
            attribute float speed, x, y;
            attribute float isNMS;
            attribute float passed;
            varying float V_isNMS;
            varying float V_passed;
            varying float V_y;
            uniform float interp;
            uniform float stageWidth;
            uniform float stageHeight;
            uniform float pointWidth;

            // helper function to transform from pixel space to normalized
            // device coordinates (NDC). In NDC (0,0) is the middle,
            // (-1, 1) is the top left and (1, -1) is the bottom right.
            // http://peterbeshai.com/beautifully-animate-points-with-webgl-and-regl.html
            float normalizeY(float y) {
                return -(2.0 * ((y / stageHeight) - 0.5));
            }
            void main() {
                float t = mod(x + interp*speed, 1.0);

                // cubic ease
                float ct = t < 0.5
                  ? 4.0 * t * t * t
                  : -0.5 * pow(abs(2.0 * t - 2.0), 3.0) + 1.0;

                //float y = mix(1.0, -1.0, ct);

                float normalizedY = normalizeY(y);
                gl_Position = vec4(x, normalizeY(y), 0, 1);

                if (passed != 1.0) {
                    gl_PointSize = pointWidth / 2.0;
                } else {
                    gl_PointSize = pointWidth;
                }

                V_isNMS = isNMS;
                V_passed = passed;
                V_y = -(2.0 * ((y / stageHeight) - 0.5));
            }`,

        frag: `
            precision mediump float;
            varying float V_isNMS;
            varying float V_passed;
            varying float V_y;
            void main() {
                vec4 blue = vec4(0.35, 0.78, 0.93, 1);
                vec4 blueDark = vec4(0.58, 0.73, 0.78, 1);
                vec4 orange = vec4(1.0, 0.72, .043, 1);
                vec4 orangeDark = vec4(0.83, 0.74, 0.65, 1);

                if (V_isNMS == 1.0) {
                    if (V_passed != 1.0) {
                        gl_FragColor = blueDark;
                    } else {
                        gl_FragColor = blue;
                    }
                } else {
                    if (V_passed != 1.0) {
                        gl_FragColor = orangeDark;
                    } else {
                        gl_FragColor = orange;
                    }
                }
            }`,

        attributes: {
            x: function(ctx, props) {
                return props.points.map(p => p.x);
            },
            speed: function(ctx, props) {
                return props.points.map(p => p.speed);
            },
            y: function(ctx, props) {
                return props.points.map(p => p.y);
            },
            isNMS: function(ctx, props) {
                return props.points.map(p => p.isNMS);
            },
            passed: function(ctx, props) {
                return props.points.map(p => p.passed);
            }
        },
        uniforms: {
          interp: (ctx, props) => props.interp,
          pointWidth: (ctx, props) => props.pointWidth,

          // FYI: there is a helper method for grabbing
          // values out of the context as well.
          // These uniforms are used in our fragment shader to
          // convert our x / y values to WebGL coordinate space.
          stageWidth: regl.context('drawingBufferWidth'),
          stageHeight: regl.context('drawingBufferHeight')
        },
        primitive: 'point',
        count: function(context, props) {
            // set the count based on the number of points we have
            return props.points.length
        }
    });

    // For some reason the regl frame keeps ticking even
    // when the tab unfocuses, which it shouldn't do since
    // it is wrapped in requestAnimationFrame but couldn't
    // figure out why it keeps running.
    window.regltick = regl.frame(({ time }) => {
        // Loop backwards because we will be removing elements
        // as we loop through backwards we will not break the loop because
        // of re-indexing issues.
        var visiblePointsIndex = visiblePoints.length;
        while (visiblePointsIndex--) {
            let point = visiblePoints[visiblePointsIndex];
            point.y += point.speed;

            if (point.y > MAX_HEIGHT + 20) {
                // It has reached the end. I must update the result bars and the numbers in
                // the statistics fields.
                if (point.isNMS === 1) {
                    increaseStatistics('nms', point.students, point.passed, point.percentageOfTotal);
                } else {
                    increaseStatistics('hs', point.students, point.passed, point.percentageOfTotal);
                }

                // Remove point from array.
                visiblePoints.splice(visiblePointsIndex, 1);
            }
        }


        let newPoints = getNextDataBatch(previousTime, time);

        for (let i = 0; i < newPoints.length; i++) {
            let studentCount = parseFloat($('.student-count').data('count'), 10);

            studentCount += newPoints[i]['students'];

            $('.student-count').data('count', studentCount);

            // console.log(currentPointCount, newPoints[i]['students']);
            $('.student-count').html(new Intl.NumberFormat('de-DE').format(studentCount.toFixed(0)));  // 12,345.67);
        }

        visiblePoints = visiblePoints.concat(newPoints);

        drawPoints({
            interp: time / 40,
            points: visiblePoints,
            pointWidth: settings['pointwidth']
        });

        previousTime = time;

        // once we have no more points we will finalize some stuff and destroy the webgl instance.
        if (visiblePoints.length === 0) {
            setMinOpacityToAllCubes();
            window.regl.destroy();
            window.regl = null;
        }
    });
}

function increaseStatistics(type, students, passed, percentageOfTotal) {
    if (type === 'nms') {
        totalNmsStudents += students;

        if (passed === 1) {
            totalNmsPassed += students;
            $('.' + type + '-stats .passed .count').html(new Intl.NumberFormat('de-DE').format(totalNmsPassed.toFixed(0)));  // 12,345.67);

            increasePercentageStatistic($('.' + type + '-stats .passed .percentage'), percentageOfTotal);
        } else {
            totalNmsNotPassed += students;
            $('.' + type + '-stats .not-passed .count').html(new Intl.NumberFormat('de-DE').format(totalNmsNotPassed.toFixed(0)));  // 12,345.67);

            increasePercentageStatistic($('.' + type + '-stats .not-passed .percentage'), percentageOfTotal);
        }
    } else {
        totalHsStudents += students;

        if (passed === 1) {
            totalHsPassed += students;
            $('.' + type + '-stats .passed .count').html(new Intl.NumberFormat('de-DE').format(totalHsPassed.toFixed(0)));  // 12,345.67);

            increasePercentageStatistic($('.' + type + '-stats .passed .percentage'), percentageOfTotal);
        } else {
            totalHsNotPassed += students;
            $('.' + type + '-stats .not-passed .count').html(new Intl.NumberFormat('de-DE').format(totalHsNotPassed.toFixed(0)));  // 12,345.67);

            increasePercentageStatistic($('.' + type + '-stats .not-passed .percentage'), percentageOfTotal);
        }
    }

    updateResultBar(type, passed, percentageOfTotal);
}

function increasePercentageStatistic($target, percentageToAdd) {
    let currentPercentage = $target.data('percentage');

    if (typeof(currentPercentage) !== 'number') {
        currentPercentage = 0;
    }

    currentPercentage += percentageToAdd;

    // Round it for visualisation purposes.
    $target.html((Math.round(currentPercentage * 100) / 100).toFixed(2) + '%');

    // But save the raw number in data or else the total sum in the end will not be correct.
    $target.data('percentage', currentPercentage);
}

var opacitySumNmsPassed = 0;
var opacitySumNmsNotPassed = 0;

var opacitySumHsPassed = 0;
var opacitySumHsNotPassed = 0;


var currentNmsPassedCubeIndex = 0;
var currentHsPassedCubeIndex = 0;

var currentNmsNotPassedCubeIndex = 49;
var currentHsNotPassedCubeIndex = 49;

useTopNms = true;
useTopHs = true;

useTopNmsNotPassed = false;
useTopHsNotPassed = false;

function updateResultBar(type, passed, percentageOfTotal) {
    if (type === 'nms') {
        if (passed === 1) {
            opacitySumNmsPassed += percentageOfTotal;

            $nmsPassedCube.addClass('cube-nms-g');
            $nmsPassedCube.css('opacity', opacityScaleCube(opacitySumNmsPassed));

            if (opacitySumNmsPassed > scaleUpperCubeResultBar) {
                opacitySumNmsPassed = 0;

                useTopNms = !useTopNms;

                let next;
                if (useTopNms == true) {
                    next = currentNmsPassedCubeIndex;
                } else {
                    next = currentNmsPassedCubeIndex + 25;

                    // Must come after so it is prepared for the next column.
                    currentNmsPassedCubeIndex += 1;
                }

                $nmsPassedCube = getNextCubeTarget(type, next);
            }
        } else {
            opacitySumNmsNotPassed += percentageOfTotal;
            $nmsNotPassedCube.addClass('cube-nms-ng');
            $nmsNotPassedCube.css('opacity', opacityScaleCube(opacitySumNmsNotPassed));

            if (opacitySumNmsNotPassed > scaleUpperCubeResultBar) {
                opacitySumNmsNotPassed = 0;

                useTopNmsNotPassed = !useTopNmsNotPassed;

                let next;
                if (useTopNmsNotPassed == true) {
                    next = currentNmsNotPassedCubeIndex - 25;

                    // Must come after so it is prepared for the next column.
                    currentNmsNotPassedCubeIndex -= 1;
                } else {
                    next = currentNmsNotPassedCubeIndex;

                }

                $nmsNotPassedCube = getNextCubeTarget(type, next);
            }
        }
    } else {
        if (passed === 1) {
            opacitySumHsPassed += percentageOfTotal;

            $hsPassedCube.addClass('cube-hs-g');
            $hsPassedCube.css('opacity', opacityScaleCube(opacitySumHsPassed));

            if (opacitySumHsPassed > scaleUpperCubeResultBar) {
                opacitySumHsPassed = 0;

                useTopHs = !useTopHs;

                let next;
                if (useTopHs == true) {
                    next = currentHsPassedCubeIndex;
                } else {
                    next = currentHsPassedCubeIndex + 25;

                    // Must come after so it is prepared for the next column.
                    currentHsPassedCubeIndex += 1;
                }

                $hsPassedCube = getNextCubeTarget(type, next);
            }
        } else {
            opacitySumHsNotPassed += percentageOfTotal;

            $hsNotPassedCube.addClass('cube-hs-ng');
            $hsNotPassedCube.css('opacity', opacityScaleCube(opacitySumHsNotPassed));

            if (opacitySumHsNotPassed > scaleUpperCubeResultBar) {
                opacitySumHsNotPassed = 0;

                useTopHsNotPassed = !useTopHsNotPassed;

                let next;
                if (useTopHsNotPassed == true) {
                    next = currentHsNotPassedCubeIndex - 25;

                    // Must come after so it is prepared for the next column.
                    currentHsNotPassedCubeIndex -= 1;
                } else {
                    next = currentHsNotPassedCubeIndex;

                }

                $hsNotPassedCube = getNextCubeTarget(type, next);
            }
        }
    }
}

function getNextCubeTarget(type, index) {
    return $($('.cube-' + type)[index]);
}

function setMinOpacityToAllCubes() {
    $('#result-graph .cube').each(function(index, el) {
        var opacity = $(this).css('opacity');
        var minLimit = 0.7
        if (opacity < minLimit) {
            $(this).css({
                'opacity': minLimit
            })
        }
    })
}
