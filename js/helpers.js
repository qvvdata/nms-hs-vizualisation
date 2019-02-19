function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
        var item = part.split("=");

        if (item[0] === 'pointwidth' || item[0] === 'pointspersecond' || item[0] === 'minspeed' || item[0] === 'maxspeed') {
            result[item[0]] = parseInt(decodeURIComponent(item[1]), 10);
        } else if (item[0] === 'lockfilters' || item[0] === 'autostart' || item[0] === 'flipstats') {
            result[item[0]] = (decodeURIComponent(item[1]) === 'true');
        } else {
            result[item[0]] = decodeURIComponent(item[1]);
        }
    });
    return result;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function applySelectedSettingsToFilterView(settings) {
    for (let prop in settings) {
        let val = settings[prop];
        let $filters = $('#filters');

        // Find the list element for this value.
        let $el = $filters.find('[data-filter="' + prop + '"] li[data-value="' + val + '"]')

        // Get the label of the selected value.
        let label = $el.html();

        // Hide the element because we will put in the current value holder.
        $el.hide();

        // Set the label to the value holder.
        $filters.find('[data-filter="' + prop + '"]').find('.filter-current-val').html(label);
    }
}

function bindClickEventsFilters(settings, callback) {
    let $filters = $('#filters');

    $filters.find('li').on('click touchstart', function() {
        let prop = $(this).parent().parent().data('filter');
        let val = $(this).data('value');
        let label = $(this).html();

        // Show all list elements in this submenu.
        $(this).parent().find('li').show();

        // Hide the selected element.
        $(this).hide();

        // Apply selection to the current shown value.
        $filters.find('[data-filter=' + prop + ']').find('.filter-current-val').html(label);

        settings[prop] = val;

        // console.log('settings', settings, callback);

        callback();
    });
}

function drawResultBarChart(cubes) {
    $('#result-graph .cube-outer-holder').html('');

    let html = '';

    let arrBars = [{
            id: 'nms-bar',
            cubeClass: 'nms'
        },
        {
            id: 'hs-bar',
            cubeClass: 'hs'
        }
    ];

    for (let i = 0; i < arrBars.length; i++) {
        html += '<ul id="' + arrBars[i]['id'] + '" class="cube-holder">';

        for (let j = 0; j < cubes; j++) {
            html += '<li class="cube cube-' + arrBars[i]['cubeClass'] + '"></li>';
        }

        html += '</ul>';
    }   

    $('#result-graph .cube-outer-holder').append(html);
}
